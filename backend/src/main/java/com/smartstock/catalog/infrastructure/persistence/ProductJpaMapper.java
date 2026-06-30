package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.infrastructure.persistence.jpa.ProductJpaEntity;
import java.time.OffsetDateTime;

public final class ProductJpaMapper {

  private ProductJpaMapper() {
  }

  public static ProductJpaEntity toEntity(Product product) {
    OffsetDateTime now = OffsetDateTime.now();

    return new ProductJpaEntity(
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
        product.barcode(),
        now,
        now);
  }

  public static Product toDomain(ProductJpaEntity entity) {
    return new Product(
        entity.getId(),
        entity.getName(),
        entity.getCategory(),
        entity.getBrand(),
        entity.getInternalCode(),
        entity.getVariationType(),
        entity.getDescription(),
        entity.getUnitOfMeasure(),
        entity.getCostValue(),
        entity.getSaleMarkup(),
        entity.getSalePrice(),
        entity.getBarcode());
  }
}
