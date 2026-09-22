package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class CreateUserUseCase {

  private static final Set<String> VALID_ROLES = Set.of("ADMIN", "OPERADOR");

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;

  public CreateUserUseCase(UserRepositoryPort userRepository, PasswordEncoderPort passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public User execute(String username, String rawPassword, String displayName, String role) {
    String cleanUsername = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    String cleanPassword = rawPassword == null ? "" : rawPassword;
    String cleanDisplayName = displayName == null ? "" : displayName.trim();
    String cleanRole = role == null ? "" : role.trim().toUpperCase(Locale.ROOT);

    if (cleanUsername.isBlank() || cleanUsername.length() < 3) {
      throw new IllegalArgumentException("O identificador do usuario deve ter pelo menos 3 caracteres.");
    }
    if (cleanPassword.length() < 6) {
      throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
    }
    if (cleanDisplayName.isBlank()) {
      throw new IllegalArgumentException("O nome de exibicao e obrigatorio.");
    }
    if (!VALID_ROLES.contains(cleanRole)) {
      throw new IllegalArgumentException("Papel invalido. Use ADMIN ou OPERADOR.");
    }
    if (userRepository.findByUsername(cleanUsername).isPresent()) {
      throw new UserAlreadyExistsException(cleanUsername);
    }

    return userRepository.save(new User(
        null,
        cleanUsername,
        passwordEncoder.encode(cleanPassword),
        cleanDisplayName,
        cleanRole,
        true,
        OffsetDateTime.now()));
  }
}
