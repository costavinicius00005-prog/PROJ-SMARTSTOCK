package com.smartstock.iam.application.usecase;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class UpdateUserUseCase {

  private static final Set<String> VALID_ROLES = Set.of("ADMIN", "FINANCEIRO", "OPERADOR");

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;
  private final String defaultAdminUsername;

  public UpdateUserUseCase(UserRepositoryPort userRepository, PasswordEncoderPort passwordEncoder,
      @Value("${ADMIN_USERNAME:admin}") String defaultAdminUsername) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.defaultAdminUsername = defaultAdminUsername.trim().toLowerCase(Locale.ROOT);
  }

  public User execute(Long id, Boolean active, String role, String newPassword) {
    User current = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));

    boolean nextActive = active != null ? active : current.active();
    String nextRole = current.role();
    String nextPasswordHash = current.passwordHash();

    if (role != null && !role.isBlank()) {
      nextRole = role.trim().toUpperCase(Locale.ROOT);
      if (!VALID_ROLES.contains(nextRole)) {
        throw new IllegalArgumentException("Papel invalido. Use ADMIN, FINANCEIRO ou OPERADOR.");
      }
    }

    // RN02: o administrador padrao nao pode ser desativado nem perder o papel ADMIN (garantia de acesso)
    if (current.username().equalsIgnoreCase(defaultAdminUsername)) {
      if (!nextActive) {
        throw new IllegalArgumentException("O administrador padrao nao pode ser desativado.");
      }
      if (!"ADMIN".equals(nextRole)) {
        throw new IllegalArgumentException("O papel do administrador padrao nao pode ser alterado.");
      }
    }

    if (newPassword != null) {
      PasswordPolicy.validate(newPassword, current.username());
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
