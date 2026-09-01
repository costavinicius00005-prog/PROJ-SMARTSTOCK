package com.smartstock.catalog.infrastructure.web;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
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
    String barcode,
    java.util.List<com.smartstock.catalog.domain.ProductComponent> composition) {
}
