package com.smartstock.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductCompositionItem(
    UUID productId,
    String internalCode,
    String name,
    String unitOfMeasure,
    BigDecimal quantity,
    BigDecimal stockAvailable,
    BigDecimal producibleQuantity,
    BigDecimal costValue) {
}
