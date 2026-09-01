package com.smartstock.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductComponent(UUID productId, BigDecimal quantity) {
  public ProductComponent {
    if (productId == null) throw new IllegalArgumentException("O produto componente e obrigatorio.");
    if (quantity == null || quantity.signum() <= 0) {
      throw new IllegalArgumentException("A quantidade do componente deve ser maior que zero.");
    }
  }
}
