package com.smartstock.catalog.application.usecase;

import java.math.BigDecimal;

public record CreateProductCommand(
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
