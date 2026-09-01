package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.domain.Product;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;
import com.smartstock.catalog.domain.ProductCompositionItem;

public record ProductResponse(
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
    String barcode,
    BigDecimal stockAvailable,
    BigDecimal estimatedCompositionCost,
    List<ProductCompositionItem> composition) {

  public static ProductResponse fromDomain(Product product, BigDecimal stockAvailable,
      BigDecimal estimatedCompositionCost, List<ProductCompositionItem> composition) {
    return new ProductResponse(
        product.id(),
        product.name(),
        product.categoryId(),
        product.category(),
        product.brandId(),
        product.brand(),
        product.internalCode(),
        product.variationType(),
        product.description(),
        product.unitOfMeasureId(),
        product.unitOfMeasure(),
        product.costValue(),
        product.saleMarkup(),
        product.salePrice(),
        product.barcode(),
        stockAvailable,
        estimatedCompositionCost,
        composition);
  }
}
