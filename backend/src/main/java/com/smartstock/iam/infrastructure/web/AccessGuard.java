package com.smartstock.iam.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

/**
 * Autorizacao por papel nas rotas protegidas pelo {@link AuthInterceptor} (que ja validou o token e
 * gravou o papel na requisicao). Uso: accessGuard.requireAnyRole("ADMIN", "FINANCEIRO").
 */
@Component
public class AccessGuard {

  public String currentRole() {
    if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
      return null;
    }
    HttpServletRequest request = attributes.getRequest();
    Object role = request.getAttribute(AuthInterceptor.AUTH_USER_ROLE);
    return role == null ? null : role.toString();
  }

  public boolean hasAnyRole(String... roles) {
    String role = currentRole();
    return role != null && Arrays.asList(roles).contains(role);
  }

  public void requireAnyRole(String... roles) {
    if (currentRole() == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faca login para continuar.");
    }
    if (!hasAnyRole(roles)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Seu usuario nao tem permissao para esta operacao (requer: " + String.join(", ", roles) + ").");
    }
  }
}
