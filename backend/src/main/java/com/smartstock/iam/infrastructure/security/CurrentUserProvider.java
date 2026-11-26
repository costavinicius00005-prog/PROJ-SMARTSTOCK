package com.smartstock.iam.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Identifica o usuario da requisicao atual a partir da sessao ja validada pelo AuthInterceptor.
 * Usado para registrar o operador em vendas, estoque e crediario. Fora de uma requisicao HTTP
 * (rotinas agendadas) retorna "sistema".
 */
@Component
public class CurrentUserProvider {

  public static final String SYSTEM_USER = "sistema";

  public String currentUserName() {
    if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
      return SYSTEM_USER;
    }
    HttpServletRequest request = attributes.getRequest();
    Object displayName = request.getAttribute(RequestAttributes.DISPLAY_NAME);
    Object username = request.getAttribute(RequestAttributes.USERNAME);
    String name = displayName instanceof String d && !d.isBlank()
        ? d
        : username instanceof String u ? u : SYSTEM_USER;
    return name.length() > 120 ? name.substring(0, 120) : name;
  }

  public Long currentUserId() {
    if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
      return null;
    }
    Object id = attributes.getRequest().getAttribute(RequestAttributes.USER_ID);
    return id instanceof Long value ? value : null;
  }
}
