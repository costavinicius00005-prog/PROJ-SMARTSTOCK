package com.smartstock.iam.infrastructure.bootstrap;

import com.smartstock.iam.application.port.PasswordEncoderPort;
import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.application.usecase.PasswordPolicy;
import com.smartstock.iam.domain.User;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Cria o primeiro administrador quando o banco nao tem usuarios.
 *
 * <p>Nao existe mais senha padrao: usa ADMIN_PASSWORD do .env (validada pela politica de senha) ou,
 * se ausente, gera uma senha aleatoria forte e a mostra uma unica vez no log de inicializacao.
 * Em bancos ja existentes, avisa no log se o administrador ainda usa a antiga senha "admin123".
 */
@Component
public class DefaultAdminSeeder implements ApplicationRunner {

  private static final Logger LOG = LoggerFactory.getLogger(DefaultAdminSeeder.class);
  private static final String LEGACY_DEFAULT_PASSWORD = "admin123";
  private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  private final UserRepositoryPort userRepository;
  private final PasswordEncoderPort passwordEncoder;
  private final String adminUsername;
  private final String adminPassword;

  public DefaultAdminSeeder(
      UserRepositoryPort userRepository,
      PasswordEncoderPort passwordEncoder,
      @Value("${ADMIN_USERNAME:admin}") String adminUsername,
      @Value("${ADMIN_PASSWORD:}") String adminPassword) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.adminUsername = adminUsername;
    this.adminPassword = adminPassword;
  }

  @Override
  public void run(ApplicationArguments args) {
    String username = adminUsername.trim().toLowerCase(Locale.ROOT);

    if (userRepository.count() > 0) {
      warnIfLegacyPassword(username);
      return;
    }

    String password = adminPassword == null ? "" : adminPassword;
    boolean generated = password.isBlank();
    if (generated) {
      password = randomPassword(20);
    } else {
      PasswordPolicy.validate(password, username);
    }

    userRepository.save(new User(
        null,
        username,
        passwordEncoder.encode(password),
        "Administrador",
        "ADMIN",
        true,
        OffsetDateTime.now()));

    if (generated) {
      LOG.warn("""

          ==================================================================
           Primeiro administrador criado: usuario "{}"
           Senha gerada (exibida somente agora): {}
           Entre no sistema e troque a senha em "Alterar senha".
          ==================================================================""", username, password);
    } else {
      LOG.info("Primeiro administrador \"{}\" criado com a senha definida em ADMIN_PASSWORD.", username);
    }
  }

  private void warnIfLegacyPassword(String username) {
    userRepository.findByUsername(username).ifPresent(user -> {
      if (passwordEncoder.matches(LEGACY_DEFAULT_PASSWORD, user.passwordHash())) {
        LOG.warn("SEGURANCA: o usuario \"{}\" ainda usa a senha padrao antiga. Troque-a antes de expor o "
            + "sistema ou cadastrar dados reais.", username);
      }
    });
  }

  private static String randomPassword(int length) {
    SecureRandom random = new SecureRandom();
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
    }
    // garante letra e numero exigidos pela politica
    sb.setCharAt(0, 'K');
    sb.setCharAt(length - 1, '7');
    return sb.toString();
  }
}
