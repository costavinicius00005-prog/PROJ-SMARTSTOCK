package com.smartstock.iam.application.usecase;

import java.util.Locale;
import java.util.Set;

/**
 * Politica minima de senha: 8+ caracteres, ao menos uma letra e um numero, diferente do usuario e
 * fora da lista de senhas obvias (incluindo a antiga senha padrao admin123).
 */
public final class PasswordPolicy {

  public static final int MIN_LENGTH = 8;

  private static final Set<String> FORBIDDEN = Set.of(
      "admin123", "12345678", "123456789", "1234567890", "password", "password1", "senha123",
      "senha1234", "smartstock", "smartstock1", "smartstock123", "qwerty123", "abc12345", "admin1234");

  private PasswordPolicy() {
  }

  public static void validate(String password, String username) {
    if (password == null || password.length() < MIN_LENGTH) {
      throw new IllegalArgumentException("A senha deve ter pelo menos " + MIN_LENGTH + " caracteres.");
    }
    if (password.length() > 128) {
      throw new IllegalArgumentException("A senha pode ter no maximo 128 caracteres.");
    }
    if (!password.matches(".*\\p{L}.*") || !password.matches(".*\\d.*")) {
      throw new IllegalArgumentException("A senha deve conter letras e numeros.");
    }
    String lower = password.toLowerCase(Locale.ROOT);
    if (FORBIDDEN.contains(lower)) {
      throw new IllegalArgumentException("Esta senha e muito comum. Escolha outra.");
    }
    if (username != null && !username.isBlank() && lower.contains(username.trim().toLowerCase(Locale.ROOT))) {
      throw new IllegalArgumentException("A senha nao pode conter o nome de usuario.");
    }
  }
}
