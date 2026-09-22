package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListUsersUseCase {

  private final UserRepositoryPort userRepository;

  public ListUsersUseCase(UserRepositoryPort userRepository) {
    this.userRepository = userRepository;
  }

  public List<User> execute() {
    return userRepository.findAll();
  }
}
