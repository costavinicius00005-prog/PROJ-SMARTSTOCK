package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.infrastructure.security.SecurityAuditService;
import com.smartstock.iam.infrastructure.security.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Consulta da trilha de seguranca e gestao de sessoes ativas (somente ADMIN, ver ModuleAccessPolicy). */
@RestController
@RequestMapping("/api/security")
public class SecurityAdminController {

  private final SecurityAuditService audit;
  private final SessionService sessions;

  public SecurityAdminController(SecurityAuditService audit, SessionService sessions) {
    this.audit = audit;
    this.sessions = sessions;
  }

  @GetMapping("/audit")
  public List<SecurityAuditService.Entry> auditLog(
      @RequestParam(required = false) String eventType,
      @RequestParam(required = false) String username,
      @RequestParam(required = false) String targetId,
      @RequestParam(defaultValue = "200") int limit) {
    return audit.search(eventType, username, targetId, limit);
  }

  @GetMapping("/sessions")
  public List<SessionService.SessionInfo> activeSessions(@RequestParam(required = false) Long userId) {
    return sessions.listActive(userId);
  }

  @DeleteMapping("/sessions/{sessionId}")
  public ResponseEntity<Void> revoke(@PathVariable UUID sessionId, HttpServletRequest request) {
    if (!sessions.revoke(sessionId, null, "encerrada pelo administrador")) {
      return ResponseEntity.notFound().build();
    }
    audit.record(request, "SESSION_REVOKED", 204, "SESSION", sessionId.toString(), "pelo administrador");
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/users/{userId}/sessions")
  public Map<String, Object> revokeAllOfUser(@PathVariable Long userId, HttpServletRequest request) {
    int revoked = sessions.revokeAllForUser(userId, "encerrada pelo administrador");
    audit.record(request, "SESSION_REVOKED", 200, "USER", String.valueOf(userId),
        revoked + " sessao(oes) encerrada(s) pelo administrador");
    return Map.of("revoked", revoked);
  }
}
