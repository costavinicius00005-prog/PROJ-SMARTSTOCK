package com.smartstock.iam.infrastructure.security;

import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Identifica o usuario da requisicao atual a partir do token (cabecalho Authorization).
 * Usado para registrar o operador em vendas e movimentacoes de estoque; quando nao ha
 * token valido, retorna "sistema" (as rotas de negocio ainda nao exigem autenticacao).
 */
@Component
public class CurrentUserProvider {

  public static final String SYSTEM_USER = "sistema";

  private final TokenService tokenService;
  private final UserRepositoryPort users;

  public CurrentUserProvider(TokenService tokenService, UserRepositoryPort users) {
    this.tokenService = tokenService;
    this.users = users;
  }

  public String currentUserName() {
    if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
      return SYSTEM_USER;
    }
    HttpServletRequest request = attributes.getRequest();
    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      return SYSTEM_USER;
    }
    return tokenService.parse(header.substring(7).trim())
        .flatMap(token -> users.findById(token.userId()))
        .map(CurrentUserProvider::label)
        .orElse(SYSTEM_USER);
  }

  private static String label(User user) {
    String name = user.displayName() != null && !user.displayName().isBlank()
        ? user.displayName()
        : user.username();
    return name.length() > 120 ? name.substring(0, 120) : name;
  }
}
