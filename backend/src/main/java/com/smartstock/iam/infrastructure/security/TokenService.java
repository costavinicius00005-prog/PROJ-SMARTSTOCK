package com.smartstock.iam.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

  private static final long VALIDITY_SECONDS = 24 * 60 * 60;

  private final byte[] secret;

  public TokenService(@Value("${AUTH_SECRET:smartstock-dev-secret-change-in-production}") String authSecret) {
    this.secret = authSecret.getBytes(StandardCharsets.UTF_8);
  }

  public record TokenData(Long userId, String role) {
  }

  public String issue(TokenData data) {
    long expiresAt = Instant.now().getEpochSecond() + VALIDITY_SECONDS;
    String payload = data.userId() + "|" + data.role() + "|" + expiresAt;
    String encoded = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    return encoded + "." + sign(encoded);
  }

  public Optional<TokenData> parse(String token) {
    if (token == null) {
      return Optional.empty();
    }
    String[] parts = token.split("\\.");
    if (parts.length != 2 || !constantTimeEquals(sign(parts[0]), parts[1])) {
      return Optional.empty();
    }
    try {
      String payload = new String(
          Base64.getUrlDecoder().decode(parts[0]),
          StandardCharsets.UTF_8);
      String[] fields = payload.split("\\|");
      long expiresAt = Long.parseLong(fields[2]);
      if (Instant.now().getEpochSecond() > expiresAt) {
        return Optional.empty();
      }
      return Optional.of(new TokenData(Long.parseLong(fields[0]), fields[1]));
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

  private boolean constantTimeEquals(String a, String b) {
    return java.security.MessageDigest.isEqual(
        a.getBytes(StandardCharsets.UTF_8),
        b.getBytes(StandardCharsets.UTF_8));
  }
}
