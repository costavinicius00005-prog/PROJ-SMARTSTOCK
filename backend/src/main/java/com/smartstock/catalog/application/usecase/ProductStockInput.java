package com.smartstock.catalog.application.usecase;

import java.math.BigDecimal;

final class ProductStockInput {

  private ProductStockInput() {
  }

  /** Valida a quantidade em estoque informada no cadastro; null significa "nao informado". */
  static BigDecimal validate(BigDecimal stockQuantity) {
    if (stockQuantity == null) return null;
    if (stockQuantity.signum() < 0) {
      throw new IllegalArgumentException("A quantidade em estoque nao pode ser negativa.");
    }
    return stockQuantity;
  }

  static boolean hasComposition(CreateProductCommand command) {
    return command.composition() != null && !command.composition().isEmpty();
  }
}
