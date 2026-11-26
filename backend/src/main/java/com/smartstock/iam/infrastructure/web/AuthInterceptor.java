package com.smartstock.iam.infrastructure.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartstock.iam.infrastructure.security.RequestAttributes;
import com.smartstock.iam.infrastructure.security.SecurityAuditService;
import com.smartstock.iam.infrastructure.security.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Autenticacao e autorizacao de toda a API (/api/**, exceto /api/auth/login).
 *
 * <ol>
 *   <li>Exige o cabecalho Authorization: Bearer &lt;token&gt;.</li>
 *   <li>Valida assinatura, expiracao e a sessao no banco (revogada, inativa, usuario desativado).</li>
 *   <li>Aplica a matriz de permissoes por modulo ({@link ModuleAccessPolicy}).</li>
 * </ol>
 * Toda negativa (401/403) e registrada na trilha de seguranca.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

  /** Mantidos por compatibilidade com o codigo que ja le estes atributos. */
  static final String AUTH_USER_ID = RequestAttributes.USER_ID;
  public static final String AUTH_USER_ROLE = RequestAttributes.ROLE;

  private final SessionService sessionService;
  private final ModuleAccessPolicy accessPolicy;
  private final SecurityAuditService audit;
  private final ObjectMapper objectMapper;

  public AuthInterceptor(
      SessionService sessionService,
      ModuleAccessPolicy accessPolicy,
      SecurityAuditService audit,
      ObjectMapper objectMapper) {
    this.sessionService = sessionService;
    this.accessPolicy = accessPolicy;
    this.audit = audit;
    this.objectMapper = objectMapper;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {

    // Requisicoes de preflight CORS nao carregam token
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return true;
    }

    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      return reject(request, response, HttpServletResponse.SC_UNAUTHORIZED,
          "Token de acesso nao informado.", "sem token");
    }

    var session = sessionService.validate(header.substring(7).trim());
    if (session.isEmpty()) {
      return reject(request, response, HttpServletResponse.SC_UNAUTHORIZED,
          "Sessao invalida, expirada ou encerrada. Faca login novamente.", "token invalido/expirado/revogado");
    }

    var s = session.get();
    request.setAttribute(RequestAttributes.USER_ID, s.userId());
    request.setAttribute(RequestAttributes.USERNAME, s.username());
    request.setAttribute(RequestAttributes.DISPLAY_NAME, s.displayName());
    request.setAttribute(RequestAttributes.ROLE, s.role());
    request.setAttribute(RequestAttributes.SESSION_ID, s.sessionId());

    var denied = accessPolicy.deniedBy(request.getMethod().toUpperCase(), request.getRequestURI(), s.role());
    if (denied.isPresent()) {
      return reject(request, response, HttpServletResponse.SC_FORBIDDEN,
          "Seu papel (" + s.role() + ") nao tem acesso a " + denied.get().description() + ".",
          "papel sem permissao: " + denied.get().description());
    }

    return true;
  }

  private boolean reject(HttpServletRequest request, HttpServletResponse response, int status,
      String message, String auditDetail) throws Exception {
    audit.record(request, "ACCESS_DENIED", status, null, null, auditDetail);
    request.setAttribute(RequestAttributes.DENIAL_AUDITED, Boolean.TRUE);
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(response.getWriter(), Map.of("message", message));
    return false;
  }
}
