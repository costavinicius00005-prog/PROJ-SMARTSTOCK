package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.domain.Product;
import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
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

  public static ProductResponse fromDomain(Product product) {
    return new ProductResponse(
        product.id(),
        product.name(),
        product.category(),
        product.brand(),
        product.internalCode(),
        product.variationType(),
        product.description(),
        product.unitOfMeasure(),
        product.costValue(),
        product.saleMarkup(),
        product.salePrice(),
        product.barcode());
  }
}
