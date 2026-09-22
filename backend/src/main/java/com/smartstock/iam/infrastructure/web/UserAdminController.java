package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.application.usecase.CreateUserUseCase;
import com.smartstock.iam.application.usecase.ListUsersUseCase;
import com.smartstock.iam.application.usecase.UpdateUserUseCase;
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

  public UserAdminController(
      CreateUserUseCase createUserUseCase,
      ListUsersUseCase listUsersUseCase,
      UpdateUserUseCase updateUserUseCase) {
    this.createUserUseCase = createUserUseCase;
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
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

  @PatchMapping("/{userId}")
  public UserResponse update(
      @PathVariable Long userId,
      @RequestBody UpdateUserRequest request) {
    return UserResponse.from(updateUserUseCase.execute(
        userId,
        request.active(),
        request.role(),
        request.password()));
  }
}
