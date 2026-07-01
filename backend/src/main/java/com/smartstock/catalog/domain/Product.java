package com.smartstock.catalog.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record Product(
    UUID id,
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
