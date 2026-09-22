package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.application.usecase.AuthenticateUserUseCase;
import com.smartstock.iam.application.usecase.GetUserUseCase;
import com.smartstock.iam.domain.User;
import com.smartstock.iam.infrastructure.security.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticateUserUseCase authenticateUserUseCase;
  private final GetUserUseCase getUserUseCase;
  private final TokenService tokenService;

  public AuthController(
      AuthenticateUserUseCase authenticateUserUseCase,
      GetUserUseCase getUserUseCase,
      TokenService tokenService) {
    this.authenticateUserUseCase = authenticateUserUseCase;
    this.getUserUseCase = getUserUseCase;
    this.tokenService = tokenService;
  }

  @PostMapping("/login")
  public LoginResponse login(@RequestBody LoginRequest request) {
    User user = authenticateUserUseCase.execute(request.identifier(), request.password());
    String token = tokenService.issue(new TokenService.TokenData(user.id(), user.role()));
    return LoginResponse.from(token, user);
  }

  @GetMapping("/me")
  public UserResponse me(HttpServletRequest request) {
    Long userId = (Long) request.getAttribute(AuthInterceptor.AUTH_USER_ID);
    return UserResponse.from(getUserUseCase.execute(userId));
  }
}
