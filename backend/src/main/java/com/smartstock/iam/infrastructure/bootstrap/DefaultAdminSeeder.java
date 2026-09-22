package com.smartstock.iam.infrastructure.bootstrap;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DefaultAdminSeeder implements ApplicationRunner {

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;
  private final String adminUsername;
  private final String adminPassword;

  public DefaultAdminSeeder(
      UserRepositoryPort userRepository,
      PasswordEncoderPort passwordEncoder,
      @Value("${ADMIN_USERNAME:admin}") String adminUsername,
      @Value("${ADMIN_PASSWORD:admin123}") String adminPassword) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.adminUsername = adminUsername;
    this.adminPassword = adminPassword;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (userRepository.count() > 0) {
      return;
    }

    String username = adminUsername.trim().toLowerCase();
    userRepository.save(new User(
        null,
        username,
        passwordEncoder.encode(adminPassword),
        "Administrador",
        "ADMIN",
        true,
        OffsetDateTime.now()));
  }
}
