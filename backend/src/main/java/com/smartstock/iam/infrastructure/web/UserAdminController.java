package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.application.usecase.CreateUserUseCase;
import com.smartstock.iam.application.usecase.GetUserUseCase;
import com.smartstock.iam.application.usecase.ListUsersUseCase;
import com.smartstock.iam.application.usecase.UpdateUserUseCase;
import com.smartstock.iam.domain.User;
import com.smartstock.iam.infrastructure.security.SessionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserAdminController {

  private final CreateUserUseCase createUserUseCase;
  private final ListUsersUseCase listUsersUseCase;
  private final UpdateUserUseCase updateUserUseCase;
  private final GetUserUseCase getUserUseCase;
  private final SessionService sessions;

  public UserAdminController(
      CreateUserUseCase createUserUseCase,
      ListUsersUseCase listUsersUseCase,
      UpdateUserUseCase updateUserUseCase,
      GetUserUseCase getUserUseCase,
      SessionService sessions) {
    this.createUserUseCase = createUserUseCase;
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.getUserUseCase = getUserUseCase;
    this.sessions = sessions;
  }

  @GetMapping
  public List<UserResponse> list() {
    return listUsersUseCase.execute().stream()
        .map(UserResponse::from)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserResponse create(@RequestBody CreateUserRequest request) {
    return UserResponse.from(createUserUseCase.execute(
        request.username(),
        request.password(),
        request.displayName(),
        request.role()));
  }

  /**
   * Desativar o usuario, trocar o papel ou redefinir a senha encerra todas as sessoes dele: o novo
   * estado vale imediatamente, sem esperar o token expirar.
   */
  @PatchMapping("/{userId}")
  public UserResponse update(
      @PathVariable Long userId,
      @RequestBody UpdateUserRequest request) {
    User before = getUserUseCase.execute(userId);
    User after = updateUserUseCase.execute(
        userId,
        request.active(),
        request.role(),
        request.password());
    if (before.active() != after.active() || !before.role().equals(after.role()) || request.password() != null) {
      sessions.revokeAllForUser(userId, "alteracao de acesso pelo administrador");
    }
    return UserResponse.from(after);
  }
}
