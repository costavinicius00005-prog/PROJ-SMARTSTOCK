package com.smartstock.catalog.application.usecase;

public final class ProductInputSanitizer {

  private ProductInputSanitizer() {
  }

  public static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }
}
