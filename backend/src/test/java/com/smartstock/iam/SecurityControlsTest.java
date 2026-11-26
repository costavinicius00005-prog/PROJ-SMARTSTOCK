package com.smartstock.iam;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartstock.iam.application.usecase.PasswordPolicy;
import com.smartstock.iam.infrastructure.security.LoginAttemptService;
import com.smartstock.iam.infrastructure.security.TokenService;
import com.smartstock.iam.infrastructure.web.ModuleAccessPolicy;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class SecurityControlsTest {

  private static final String SECRET = "segredo-de-teste-com-mais-de-32-caracteres-123";

  @Nested
  class Tokens {

    private final TokenService tokens = new TokenService(SECRET);

    @Test
    void recusaSubirSemSegredoOuComSegredoCurto() {
      assertThatThrownBy(() -> new TokenService("")).isInstanceOf(IllegalStateException.class);
      assertThatThrownBy(() -> new TokenService("curto")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void tokenValidoCarregaSessaoEUsuario() {
      UUID session = UUID.randomUUID();
      String token = tokens.issue(session, 7L, Instant.now().plusSeconds(60));
      var data = tokens.parse(token).orElseThrow();
      assertThat(data.sessionId()).isEqualTo(session);
      assertThat(data.userId()).isEqualTo(7L);
    }

    @Test
    void tokenAdulteradoOuDeOutroSegredoEhRecusado() {
      String token = tokens.issue(UUID.randomUUID(), 7L, Instant.now().plusSeconds(60));
      String forged = "x" + token.substring(1);
      assertThat(tokens.parse(forged)).isEmpty();
      var other = new TokenService("outro-segredo-tambem-com-mais-de-32-caracteres");
      assertThat(other.parse(token)).isEmpty();
    }

    @Test
    void tokenExpiradoEhRecusado() {
      String token = tokens.issue(UUID.randomUUID(), 7L, Instant.now().minusSeconds(1));
      assertThat(tokens.parse(token)).isEmpty();
    }
  }

  @Nested
  class Senhas {

    @Test
    void aceitaSenhaForte() {
      PasswordPolicy.validate("Caixa2026loja", "maria");
    }

    @Test
    void recusaSenhaCurtaSemNumeroComumOuComUsuario() {
      assertThatThrownBy(() -> PasswordPolicy.validate("abc12", "maria")).isInstanceOf(IllegalArgumentException.class);
      assertThatThrownBy(() -> PasswordPolicy.validate("somenteletras", "maria")).isInstanceOf(IllegalArgumentException.class);
      assertThatThrownBy(() -> PasswordPolicy.validate("admin123", "x")).isInstanceOf(IllegalArgumentException.class);
      assertThatThrownBy(() -> PasswordPolicy.validate("maria2026x", "maria")).isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  class TentativasDeLogin {

    @Test
    void bloqueiaUsuarioAposCincoFalhasEDesbloqueiaComSucesso() {
      var attempts = new LoginAttemptService(5, 15);
      for (int i = 0; i < 4; i++) {
        attempts.recordFailure("admin", "10.0.0.1");
      }
      assertThat(attempts.blockedForSeconds("admin", "10.0.0.1")).isZero();
      attempts.recordFailure("admin", "10.0.0.1");
      assertThat(attempts.blockedForSeconds("admin", "10.0.0.2")).isPositive();
      assertThat(attempts.blockedForSeconds("outro", "10.0.0.2")).isZero();
    }

    @Test
    void bloqueiaIpQueTestaMuitosUsuarios() {
      var attempts = new LoginAttemptService(5, 15);
      for (int i = 0; i < 20; i++) {
        attempts.recordFailure("usuario" + i, "10.0.0.9");
      }
      assertThat(attempts.blockedForSeconds("novo", "10.0.0.9")).isPositive();
    }
  }

  @Nested
  class PermissoesPorModulo {

    private final ModuleAccessPolicy policy = new ModuleAccessPolicy();

    @Test
    void financeiroSoParaAdminEFinanceiro() {
      assertThat(policy.deniedBy("GET", "/api/finance/summary", "OPERADOR")).isPresent();
      assertThat(policy.deniedBy("GET", "/api/finance/summary", "FINANCEIRO")).isEmpty();
      assertThat(policy.deniedBy("GET", "/api/accounting/overview", "ADMIN")).isEmpty();
    }

    @Test
    void usuariosLgpdEExclusoesSoParaAdmin() {
      assertThat(policy.deniedBy("GET", "/api/users", "FINANCEIRO")).isPresent();
      assertThat(policy.deniedBy("POST", "/api/clients/abc/anonymize", "OPERADOR")).isPresent();
      assertThat(policy.deniedBy("DELETE", "/api/clients/abc", "OPERADOR")).isPresent();
      assertThat(policy.deniedBy("DELETE", "/api/clients/abc", "ADMIN")).isEmpty();
    }

    @Test
    void gpsAoVivoNaoEhParaFinanceiro() {
      assertThat(policy.deniedBy("GET", "/api/deliveries/live", "FINANCEIRO")).isPresent();
      assertThat(policy.deniedBy("GET", "/api/deliveries/live", "OPERADOR")).isEmpty();
    }

    @Test
    void modulosOperacionaisLiberadosParaTodos() {
      assertThat(policy.deniedBy("GET", "/api/clients", "OPERADOR")).isEmpty();
      assertThat(policy.deniedBy("POST", "/api/sales/checkout/complete", "FINANCEIRO")).isEmpty();
      assertThat(policy.deniedBy("GET", "/api/settings", "OPERADOR")).isEmpty();
      assertThat(policy.deniedBy("PUT", "/api/settings", "OPERADOR")).isPresent();
    }
  }
}
