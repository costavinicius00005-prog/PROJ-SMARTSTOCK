package com.smartstock.partners.application.usecase;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ClientInputSanitizer {

  private ClientInputSanitizer() {
  }

  public static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }

  public static String documentToNull(String value) {
    String sanitizedValue = blankToNull(value);

    if (sanitizedValue == null) {
      return null;
    }

    String digits = sanitizedValue.replaceAll("\\D", "");

    return digits.isBlank() ? null : digits;
  }

  /** Limite de credito: nulo = sem limite definido; negativo e rejeitado. */
  public static BigDecimal creditLimit(BigDecimal value) {
    if (value == null) {
      return null;
    }
    if (value.signum() < 0) {
      throw new IllegalArgumentException("O limite de credito nao pode ser negativo.");
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }
}
