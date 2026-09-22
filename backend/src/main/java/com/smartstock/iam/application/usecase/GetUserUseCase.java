package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import org.springframework.stereotype.Service;

@Service
public class GetUserUseCase {

  private final UserRepositoryPort userRepository;

  public GetUserUseCase(UserRepositoryPort userRepository) {
    this.userRepository = userRepository;
  }

  public User execute(Long id) {
    return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
  }
}
