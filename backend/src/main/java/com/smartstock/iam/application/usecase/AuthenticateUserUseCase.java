package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AuthenticateUserUseCase {

  /** Hash BCrypt (custo 10) de um valor aleatorio, usado so para igualar o tempo de resposta. */
  private static final String DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BWXo4jY0dX9Gk1y3c2l3OZsZ5y2G";

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

    var found = userRepository.findByUsername(identifier.trim().toLowerCase(Locale.ROOT));
    if (found.isEmpty()) {
      // Mesmo custo de uma senha errada: o tempo de resposta nao revela se o usuario existe
      passwordEncoder.matches(rawPassword, DUMMY_HASH);
      throw new InvalidCredentialsException();
    }
    User user = found.get();

    if (!passwordEncoder.matches(rawPassword, user.passwordHash())) {
      throw new InvalidCredentialsException();
    }

    if (!user.active()) {
      throw new InactiveUserException();
    }

    return user;
  }
}
