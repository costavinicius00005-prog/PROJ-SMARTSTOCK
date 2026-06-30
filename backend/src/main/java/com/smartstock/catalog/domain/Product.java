package com.smartstock.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record Product(
    UUID id,
    String name,
    String category,
    String brand,
    String internalCode,
    String variationType,
    String description,
    String unitOfMeasure,
    BigDecimal costValue,
    BigDecimal saleMarkup,
    BigDecimal salePrice,
    String barcode) {
}
