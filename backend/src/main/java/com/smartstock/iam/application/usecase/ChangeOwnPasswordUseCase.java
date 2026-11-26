package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import org.springframework.stereotype.Service;

/** O proprio usuario troca a senha, confirmando a senha atual. */
@Service
public class ChangeOwnPasswordUseCase {

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;

  public ChangeOwnPasswordUseCase(UserRepositoryPort userRepository, PasswordEncoderPort passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public User execute(Long userId, String currentPassword, String newPassword) {
    User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.passwordHash())) {
      throw new IllegalArgumentException("A senha atual nao confere.");
    }
    PasswordPolicy.validate(newPassword, user.username());
    if (passwordEncoder.matches(newPassword, user.passwordHash())) {
      throw new IllegalArgumentException("A nova senha deve ser diferente da atual.");
    }
    return userRepository.save(new User(
        user.id(), user.username(), passwordEncoder.encode(newPassword), user.displayName(),
        user.role(), user.active(), user.createdAt()));
  }
}
