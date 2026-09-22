package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class UpdateUserUseCase {

  private static final Set<String> VALID_ROLES = Set.of("ADMIN", "OPERADOR");

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;

  public UpdateUserUseCase(UserRepositoryPort userRepository, PasswordEncoderPort passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public User execute(Long id, Boolean active, String role, String newPassword) {
    User current = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));

    boolean nextActive = active != null ? active : current.active();
    String nextRole = current.role();
    String nextPasswordHash = current.passwordHash();

    if (role != null && !role.isBlank()) {
      nextRole = role.trim().toUpperCase(Locale.ROOT);
      if (!VALID_ROLES.contains(nextRole)) {
        throw new IllegalArgumentException("Papel invalido. Use ADMIN ou OPERADOR.");
      }
    }

    if (newPassword != null) {
      if (newPassword.length() < 6) {
        throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
      }
      nextPasswordHash = passwordEncoder.encode(newPassword);
    }

    return userRepository.save(new User(
        current.id(),
        current.username(),
        nextPasswordHash,
        current.displayName(),
        nextRole,
        nextActive,
        current.createdAt()));
  }
}
