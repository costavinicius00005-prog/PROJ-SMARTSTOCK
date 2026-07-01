package com.smartstock.catalog.application.usecase;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductCommand(
    String name,
    UUID categoryId,
    String category,
    UUID brandId,
    String brand,
    String internalCode,
    String variationType,
    String description,
    UUID unitOfMeasureId,
    String unitOfMeasure,
    BigDecimal costValue,
    BigDecimal saleMarkup,
    BigDecimal salePrice,
    String barcode) {
}
