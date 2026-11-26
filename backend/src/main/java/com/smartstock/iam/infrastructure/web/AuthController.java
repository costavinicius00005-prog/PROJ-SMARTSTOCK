package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.application.usecase.AuthenticateUserUseCase;
import com.smartstock.iam.application.usecase.ChangeOwnPasswordUseCase;
import com.smartstock.iam.application.usecase.GetUserUseCase;
import com.smartstock.iam.application.usecase.InactiveUserException;
import com.smartstock.iam.application.usecase.InvalidCredentialsException;
import com.smartstock.iam.domain.User;
import com.smartstock.iam.infrastructure.security.ClientIp;
import com.smartstock.iam.infrastructure.security.LoginAttemptService;
import com.smartstock.iam.infrastructure.security.RequestAttributes;
import com.smartstock.iam.infrastructure.security.SecurityAuditService;
import com.smartstock.iam.infrastructure.security.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticateUserUseCase authenticateUserUseCase;
  private final GetUserUseCase getUserUseCase;
  private final ChangeOwnPasswordUseCase changeOwnPasswordUseCase;
  private final SessionService sessions;
  private final LoginAttemptService loginAttempts;
  private final SecurityAuditService audit;

  public AuthController(
      AuthenticateUserUseCase authenticateUserUseCase,
      GetUserUseCase getUserUseCase,
      ChangeOwnPasswordUseCase changeOwnPasswordUseCase,
      SessionService sessions,
      LoginAttemptService loginAttempts,
      SecurityAuditService audit) {
    this.authenticateUserUseCase = authenticateUserUseCase;
    this.getUserUseCase = getUserUseCase;
    this.changeOwnPasswordUseCase = changeOwnPasswordUseCase;
    this.sessions = sessions;
    this.loginAttempts = loginAttempts;
    this.audit = audit;
  }

  public record ChangePasswordRequest(String currentPassword, String newPassword) {
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest http) {
    String identifier = request.identifier() == null ? "" : request.identifier().trim();
    String ip = ClientIp.of(http);

    long blockedFor = loginAttempts.blockedForSeconds(identifier, ip);
    if (blockedFor > 0) {
      audit.record(event("LOGIN_BLOCKED", null, identifier, null, ip, http, 429,
          "muitas tentativas; liberado em " + blockedFor + " s"));
      long minutes = Math.max(1, (blockedFor + 59) / 60);
      return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
          .header("Retry-After", String.valueOf(blockedFor))
          .body(Map.of("message", "Muitas tentativas de login. Tente novamente em " + minutes + " minuto(s)."));
    }

    User user;
    try {
      user = authenticateUserUseCase.execute(identifier, request.password());
    } catch (InvalidCredentialsException ex) {
      loginAttempts.recordFailure(identifier, ip);
      audit.record(event("LOGIN_FAILURE", null, identifier, null, ip, http, 401, "usuario ou senha invalidos"));
      throw ex;
    } catch (InactiveUserException ex) {
      loginAttempts.recordFailure(identifier, ip);
      audit.record(event("LOGIN_FAILURE", null, identifier, null, ip, http, 403, "usuario inativo"));
      throw ex;
    }

    loginAttempts.recordSuccess(identifier);
    var session = sessions.open(user.id(), ip, http.getHeader("User-Agent"));
    audit.record(new SecurityAuditService.Event("LOGIN_SUCCESS", user.id(), user.username(), user.role(), ip,
        "POST", http.getRequestURI(), 200, "SESSION", session.sessionId().toString(), null));
    return ResponseEntity.ok(LoginResponse.from(session.token(), user, session.expiresAt()));
  }

  @GetMapping("/me")
  public UserResponse me(HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(RequestAttributes.USER_ID);
    return UserResponse.from(getUserUseCase.execute(userId));
  }

  @PostMapping("/logout")
  public Map<String, Object> logout(HttpServletRequest request) {
    UUID sessionId = (UUID) request.getAttribute(RequestAttributes.SESSION_ID);
    sessions.revoke(sessionId, null, "logout");
    audit.record(request, "LOGOUT", 200, "SESSION", sessionId.toString(), null);
    return Map.of("ok", true);
  }

  /** Encerra todas as outras sessoes do proprio usuario (ex.: esqueceu logado em outro computador). */
  @PostMapping("/logout-others")
  public Map<String, Object> logoutOthers(HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(RequestAttributes.USER_ID);
    UUID sessionId = (UUID) request.getAttribute(RequestAttributes.SESSION_ID);
    int revoked = sessions.revokeAllForUserExcept(userId, sessionId, "encerrada pelo usuario");
    audit.record(request, "SESSION_REVOKED", 200, "USER", String.valueOf(userId), revoked + " sessao(oes) encerrada(s)");
    return Map.of("revoked", revoked);
  }

  @GetMapping("/sessions")
  public List<Map<String, Object>> mySessions(HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(RequestAttributes.USER_ID);
    UUID current = (UUID) request.getAttribute(RequestAttributes.SESSION_ID);
    return sessions.listActive(userId).stream().map(s -> {
      Map<String, Object> row = new java.util.LinkedHashMap<>();
      row.put("id", s.id());
      row.put("current", s.id().equals(current));
      row.put("createdAt", s.createdAt());
      row.put("lastSeenAt", s.lastSeenAt());
      row.put("expiresAt", s.expiresAt());
      row.put("ipAddress", s.ipAddress());
      row.put("userAgent", s.userAgent());
      return row;
    }).toList();
  }

  @DeleteMapping("/sessions/{sessionId}")
  public ResponseEntity<Void> revokeMySession(@PathVariable UUID sessionId, HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(RequestAttributes.USER_ID);
    if (!sessions.revoke(sessionId, userId, "encerrada pelo usuario")) {
      return ResponseEntity.notFound().build();
    }
    audit.record(request, "SESSION_REVOKED", 204, "SESSION", sessionId.toString(), null);
    return ResponseEntity.noContent().build();
  }

  /** Troca da propria senha; as demais sessoes do usuario sao encerradas. */
  @PostMapping("/change-password")
  public Map<String, Object> changePassword(@RequestBody ChangePasswordRequest body, HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(RequestAttributes.USER_ID);
    UUID sessionId = (UUID) request.getAttribute(RequestAttributes.SESSION_ID);
    changeOwnPasswordUseCase.execute(userId, body.currentPassword(), body.newPassword());
    int revoked = sessions.revokeAllForUserExcept(userId, sessionId, "troca de senha");
    audit.record(request, "PASSWORD_CHANGED", 200, "USER", String.valueOf(userId),
        revoked + " outra(s) sessao(oes) encerrada(s)");
    return Map.of("ok", true, "otherSessionsRevoked", revoked);
  }

  private static SecurityAuditService.Event event(String type, Long userId, String username, String role,
      String ip, HttpServletRequest http, int status, String detail) {
    return new SecurityAuditService.Event(type, userId, username, role, ip, http.getMethod(),
        http.getRequestURI(), status, null, null, detail);
  }
}
