package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.infrastructure.persistence.jpa.BrandJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.CategoryJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.ProductJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.UnitOfMeasureJpaEntity;
import java.time.OffsetDateTime;

public final class ProductJpaMapper {

  private ProductJpaMapper() {
  }

  public static ProductJpaEntity toEntity(
      Product product,
      CategoryJpaEntity category,
      BrandJpaEntity brand,
      UnitOfMeasureJpaEntity unitOfMeasure) {
    OffsetDateTime now = OffsetDateTime.now();

    return toEntity(product, category, brand, unitOfMeasure, now, now);
  }

  public static ProductJpaEntity toEntity(
      Product product,
      CategoryJpaEntity category,
      BrandJpaEntity brand,
      UnitOfMeasureJpaEntity unitOfMeasure,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {

    return new ProductJpaEntity(
        product.id(),
        product.name(),
        category,
        brand,
        product.internalCode(),
        product.variationType(),
        product.description(),
        unitOfMeasure,
        product.costValue(),
        product.saleMarkup(),
        product.salePrice(),
        product.barcode(),
        product.stockQuantity(),
        product.reservedQuantity(),
        createdAt,
        updatedAt);
  }

  public static Product toDomain(ProductJpaEntity entity) {
    return new Product(
        entity.getId(),
        entity.getName(),
        entity.getCategory().getId(),
        entity.getCategory().getName(),
        entity.getBrand().getId(),
        entity.getBrand().getName(),
        entity.getInternalCode(),
        entity.getVariationType(),
        entity.getDescription(),
        entity.getUnitOfMeasure().getId(),
        entity.getUnitOfMeasure().getAcronym() + " - " + entity.getUnitOfMeasure().getName(),
        entity.getCostValue(),
        entity.getSaleMarkup(),
        entity.getSalePrice(),
        entity.getBarcode(),
        entity.getStockQuantity(),
        entity.getReservedQuantity());
  }
}
