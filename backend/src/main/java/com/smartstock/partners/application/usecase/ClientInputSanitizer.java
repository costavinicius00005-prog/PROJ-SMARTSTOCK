package com.smartstock.partners.application.usecase;

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
}
