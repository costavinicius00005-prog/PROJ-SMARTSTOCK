package com.smartstock.iam.infrastructure.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartstock.iam.infrastructure.security.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

  static final String AUTH_USER_ID = "smartstock.auth.userId";
  static final String AUTH_USER_ROLE = "smartstock.auth.role";

  private final TokenService tokenService;
  private final ObjectMapper objectMapper;

  public AuthInterceptor(TokenService tokenService, ObjectMapper objectMapper) {
    this.tokenService = tokenService;
    this.objectMapper = objectMapper;
  }

  @Override
  public boolean preHandle(
      HttpServletRequest request,
      HttpServletResponse response,
      Object handler) throws Exception {

    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Token de acesso nao informado.");
    }

    var tokenData = tokenService.parse(header.substring(7).trim());
    if (tokenData.isEmpty()) {
      return reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Token invalido ou expirado.");
    }

    request.setAttribute(AUTH_USER_ID, tokenData.get().userId());
    request.setAttribute(AUTH_USER_ROLE, tokenData.get().role());

    boolean adminOnly = request.getRequestURI().startsWith("/api/users");
    if (adminOnly && !"ADMIN".equals(tokenData.get().role())) {
      return reject(response, HttpServletResponse.SC_FORBIDDEN, "Acesso restrito ao papel ADMIN.");
    }

    return true;
  }

  private boolean reject(HttpServletResponse response, int status, String message) throws Exception {
    response.setStatus(status);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(response.getWriter(), Map.of("message", message));
    return false;
  }
}
