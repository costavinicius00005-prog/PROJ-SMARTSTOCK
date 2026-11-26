package com.smartstock.iam.infrastructure.security;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Sessoes de login mantidas no servidor (tabela user_sessions).
 *
 * <ul>
 *   <li>Expiracao absoluta: SESSION_MAX_HOURS (padrao 12 h) a partir do login.</li>
 *   <li>Expiracao por inatividade: SESSION_IDLE_MINUTES (padrao 120 min) sem nenhuma requisicao.</li>
 *   <li>Revogacao: logout, "encerrar todas as sessoes", desativacao, troca de papel ou de senha.</li>
 * </ul>
 * A cada requisicao o papel e a situacao do usuario sao lidos do banco, nunca do token.
 */
@Service
public class SessionService {

  public record ActiveSession(UUID sessionId, Long userId, String username, String displayName, String role) {
  }

  public record SessionInfo(
      UUID id, Long userId, String username, OffsetDateTime createdAt, OffsetDateTime lastSeenAt,
      OffsetDateTime expiresAt, String ipAddress, String userAgent) {
  }

  public record IssuedSession(UUID sessionId, String token, Instant expiresAt) {
  }

  private final JdbcTemplate jdbc;
  private final TokenService tokenService;
  private final Duration maxLifetime;
  private final Duration idleTimeout;

  public SessionService(
      JdbcTemplate jdbc,
      TokenService tokenService,
      @Value("${SESSION_MAX_HOURS:12}") long maxHours,
      @Value("${SESSION_IDLE_MINUTES:120}") long idleMinutes) {
    this.jdbc = jdbc;
    this.tokenService = tokenService;
    this.maxLifetime = Duration.ofHours(Math.max(1, maxHours));
    this.idleTimeout = Duration.ofMinutes(Math.max(5, idleMinutes));
  }

  public IssuedSession open(Long userId, String ipAddress, String userAgent) {
    UUID sessionId = UUID.randomUUID();
    Instant expiresAt = Instant.now().plus(maxLifetime);
    jdbc.update("""
        INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
        """, sessionId, userId, Timestamp.from(expiresAt), truncate(ipAddress, 64), truncate(userAgent, 255));
    return new IssuedSession(sessionId, tokenService.issue(sessionId, userId, expiresAt), expiresAt);
  }

  /** Valida o token e a sessao correspondente; renova o "ultimo acesso" no maximo uma vez por minuto. */
  public Optional<ActiveSession> validate(String token) {
    return tokenService.parse(token).flatMap(data -> {
      List<ActiveSession> rows = jdbc.query("""
          SELECT s.id, u.id AS user_id, u.username, u.display_name, r.name AS role
          FROM user_sessions s
          JOIN users u ON u.id = s.user_id
          JOIN roles r ON r.id = u.role_id
          WHERE s.id = ? AND s.user_id = ?
            AND s.revoked_at IS NULL
            AND s.expires_at > now()
            AND s.last_seen_at > now() - make_interval(secs => ?)
            AND u.active = TRUE
          """,
          (rs, i) -> new ActiveSession(
              rs.getObject("id", UUID.class), rs.getLong("user_id"), rs.getString("username"),
              rs.getString("display_name"), rs.getString("role")),
          data.sessionId(), data.userId(), (double) idleTimeout.toSeconds());
      if (rows.isEmpty()) {
        return Optional.empty();
      }
      jdbc.update("""
          UPDATE user_sessions SET last_seen_at = now()
          WHERE id = ? AND last_seen_at < now() - interval '1 minute'
          """, data.sessionId());
      return Optional.of(rows.get(0));
    });
  }

  public List<SessionInfo> listActive(Long userIdOrNull) {
    String filter = userIdOrNull == null ? "" : " AND s.user_id = ?";
    Object[] args = userIdOrNull == null ? new Object[] {} : new Object[] {userIdOrNull};
    return jdbc.query("""
        SELECT s.id, s.user_id, u.username, s.created_at, s.last_seen_at, s.expires_at,
               s.ip_address, s.user_agent
        FROM user_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.revoked_at IS NULL AND s.expires_at > now()
        """ + filter + " ORDER BY s.last_seen_at DESC",
        (rs, i) -> new SessionInfo(
            rs.getObject("id", UUID.class), rs.getLong("user_id"), rs.getString("username"),
            rs.getObject("created_at", OffsetDateTime.class), rs.getObject("last_seen_at", OffsetDateTime.class),
            rs.getObject("expires_at", OffsetDateTime.class), rs.getString("ip_address"),
            rs.getString("user_agent")),
        args);
  }

  public boolean revoke(UUID sessionId, Long ownerUserIdOrNull, String reason) {
    if (ownerUserIdOrNull == null) {
      return jdbc.update("""
          UPDATE user_sessions SET revoked_at = now(), revoked_reason = ?
          WHERE id = ? AND revoked_at IS NULL
          """, reason, sessionId) > 0;
    }
    return jdbc.update("""
        UPDATE user_sessions SET revoked_at = now(), revoked_reason = ?
        WHERE id = ? AND user_id = ? AND revoked_at IS NULL
        """, reason, sessionId, ownerUserIdOrNull) > 0;
  }

  public int revokeAllForUser(Long userId, String reason) {
    return jdbc.update("""
        UPDATE user_sessions SET revoked_at = now(), revoked_reason = ?
        WHERE user_id = ? AND revoked_at IS NULL
        """, reason, userId);
  }

  public int revokeAllForUserExcept(Long userId, UUID keepSessionId, String reason) {
    return jdbc.update("""
        UPDATE user_sessions SET revoked_at = now(), revoked_reason = ?
        WHERE user_id = ? AND id <> ? AND revoked_at IS NULL
        """, reason, userId, keepSessionId);
  }

  private static String truncate(String value, int max) {
    if (value == null) {
      return null;
    }
    return value.length() > max ? value.substring(0, max) : value;
  }
}
