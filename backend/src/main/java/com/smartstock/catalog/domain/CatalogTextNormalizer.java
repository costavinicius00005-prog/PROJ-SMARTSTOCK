package com.smartstock.catalog.domain;

import java.text.Normalizer;
import java.util.Locale;

public final class CatalogTextNormalizer {

  private CatalogTextNormalizer() {
  }

  public static String normalize(String value) {
    if (value == null) {
      return "";
    }

    String withoutAccents = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "");

    return withoutAccents
        .replaceAll("\\s+", " ")
        .toLowerCase(Locale.ROOT);
  }
}
