package com.smartstock.iam.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Token de acesso assinado com HMAC-SHA256.
 *
 * <p>O token carrega apenas o identificador da sessao, o usuario e a expiracao absoluta. Papel,
 * situacao do usuario e revogacao sao conferidos no banco a cada requisicao ({@link SessionService}),
 * entao um logout, uma desativacao ou uma troca de papel valem imediatamente.
 *
 * <p>O segredo e obrigatorio (variavel AUTH_SECRET, minimo de 32 caracteres): a aplicacao nao sobe
 * com segredo padrao, o que impediria qualquer pessoa de forjar tokens com um valor conhecido.
 */
@Service
public class TokenService {

  static final int MIN_SECRET_LENGTH = 32;

  private final byte[] secret;

  public TokenService(@Value("${AUTH_SECRET:}") String authSecret) {
    if (authSecret == null || authSecret.trim().length() < MIN_SECRET_LENGTH) {
      throw new IllegalStateException(
          "AUTH_SECRET ausente ou fraco: defina no .env um segredo aleatorio com pelo menos "
              + MIN_SECRET_LENGTH + " caracteres (ex.: openssl rand -base64 48).");
    }
    this.secret = authSecret.trim().getBytes(StandardCharsets.UTF_8);
  }

  public record TokenData(UUID sessionId, Long userId, long expiresAt) {
  }

  public String issue(UUID sessionId, Long userId, Instant expiresAt) {
    String payload = sessionId + "|" + userId + "|" + expiresAt.getEpochSecond();
    String encoded = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    return encoded + "." + sign(encoded);
  }

  public Optional<TokenData> parse(String token) {
    if (token == null || token.length() > 512) {
      return Optional.empty();
    }
    String[] parts = token.split("\\.");
    if (parts.length != 2 || !constantTimeEquals(sign(parts[0]), parts[1])) {
      return Optional.empty();
    }
    try {
      String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
      String[] fields = payload.split("\\|");
      if (fields.length != 3) {
        return Optional.empty();
      }
      long expiresAt = Long.parseLong(fields[2]);
      if (Instant.now().getEpochSecond() > expiresAt) {
        return Optional.empty();
      }
      return Optional.of(new TokenData(UUID.fromString(fields[0]), Long.parseLong(fields[1]), expiresAt));
    } catch (RuntimeException ex) {
      return Optional.empty();
    }
  }

  private String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret, "HmacSHA256"));
      return Base64.getUrlEncoder().withoutPadding()
          .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception ex) {
      throw new IllegalStateException("Falha ao assinar token", ex);
    }
  }

  private static boolean constantTimeEquals(String a, String b) {
    return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
  }
}
