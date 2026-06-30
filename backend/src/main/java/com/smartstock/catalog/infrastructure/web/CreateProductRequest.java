package com.smartstock.catalog.infrastructure.web;

import java.math.BigDecimal;

public record CreateProductRequest(
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
