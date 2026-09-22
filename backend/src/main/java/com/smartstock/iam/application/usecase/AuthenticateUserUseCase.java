package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AuthenticateUserUseCase {

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;

  public AuthenticateUserUseCase(UserRepositoryPort userRepository, PasswordEncoderPort passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public User execute(String identifier, String rawPassword) {
    if (identifier == null || rawPassword == null) {
      throw new InvalidCredentialsException();
    }

    User user = userRepository
        .findByUsername(identifier.trim().toLowerCase(Locale.ROOT))
        .orElseThrow(InvalidCredentialsException::new);

    if (!passwordEncoder.matches(rawPassword, user.passwordHash())) {
      throw new InvalidCredentialsException();
    }

    if (!user.active()) {
      throw new InactiveUserException();
    }

    return user;
  }
}
