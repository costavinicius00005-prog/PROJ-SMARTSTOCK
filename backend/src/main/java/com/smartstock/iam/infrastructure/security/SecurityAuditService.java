package com.smartstock.iam.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Trilha geral de seguranca (tabela security_audit_log, somente insercao).
 *
 * <p>Registra logins, bloqueios, logout, acessos negados, leitura/alteracao/exportacao de dados
 * pessoais, consultas de localizacao e operacoes LGPD. Uma falha ao gravar a trilha nunca derruba a
 * operacao do usuario: o erro vai para o log da aplicacao.
 */
@Service
public class SecurityAuditService {

  private static final Logger LOG = LoggerFactory.getLogger(SecurityAuditService.class);

  public record Event(
      String eventType, Long userId, String username, String role, String ipAddress,
      String method, String path, Integer status, String targetType, String targetId, String detail) {
  }

  public record Entry(
      long id, OffsetDateTime occurredAt, String eventType, Long userId, String username, String role,
      String ipAddress, String method, String path, Integer status, String targetType, String targetId,
      String detail) {
  }

  private final JdbcTemplate jdbc;

  public SecurityAuditService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void record(Event e) {
    try {
      jdbc.update("""
          INSERT INTO security_audit_log
            (event_type, user_id, username, user_role, ip_address, http_method, path, http_status,
             target_type, target_id, detail)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          """,
          cut(e.eventType(), 40), e.userId(), cut(e.username(), 120), cut(e.role(), 30),
          cut(e.ipAddress(), 64), cut(e.method(), 10), cut(e.path(), 255), e.status(),
          cut(e.targetType(), 40), cut(e.targetId(), 80), cut(e.detail(), 500));
    } catch (RuntimeException ex) {
      LOG.error("Falha ao gravar trilha de auditoria de seguranca ({})", e.eventType(), ex);
    }
  }

  /** Atalho para eventos ligados a uma requisicao HTTP (usuario lido dos atributos do interceptor). */
  public void record(HttpServletRequest request, String eventType, Integer status,
      String targetType, String targetId, String detail) {
    Object userId = request.getAttribute(RequestAttributes.USER_ID);
    record(new Event(
        eventType,
        userId instanceof Long id ? id : null,
        (String) request.getAttribute(RequestAttributes.USERNAME),
        (String) request.getAttribute(RequestAttributes.ROLE),
        ClientIp.of(request),
        request.getMethod(),
        request.getRequestURI(),
        status,
        targetType,
        targetId,
        detail));
  }

  public List<Entry> search(String eventType, String username, String targetId, int limit) {
    StringBuilder sql = new StringBuilder("""
        SELECT id, occurred_at, event_type, user_id, username, user_role, ip_address, http_method,
               path, http_status, target_type, target_id, detail
        FROM security_audit_log WHERE 1 = 1
        """);
    List<Object> args = new ArrayList<>();
    if (eventType != null && !eventType.isBlank()) {
      sql.append(" AND event_type = ?");
      args.add(eventType.trim());
    }
    if (username != null && !username.isBlank()) {
      sql.append(" AND username ILIKE ?");
      args.add("%" + username.trim() + "%");
    }
    if (targetId != null && !targetId.isBlank()) {
      sql.append(" AND target_id = ?");
      args.add(targetId.trim());
    }
    sql.append(" ORDER BY occurred_at DESC, id DESC LIMIT ?");
    args.add(Math.min(Math.max(limit, 1), 1000));
    return jdbc.query(sql.toString(), (rs, i) -> new Entry(
        rs.getLong("id"), rs.getObject("occurred_at", OffsetDateTime.class), rs.getString("event_type"),
        (Long) rs.getObject("user_id"), rs.getString("username"), rs.getString("user_role"),
        rs.getString("ip_address"), rs.getString("http_method"), rs.getString("path"),
        (Integer) rs.getObject("http_status"), rs.getString("target_type"), rs.getString("target_id"),
        rs.getString("detail")), args.toArray());
  }

  private static String cut(String value, int max) {
    if (value == null) {
      return null;
    }
    return value.length() > max ? value.substring(0, max) : value;
  }
}
