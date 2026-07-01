package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.UUID;

public record CatalogOptionResponse(
    UUID id,
    String label,
    String value,
    String name,
    String acronym,
    boolean active,
    boolean systemDefault) {

  public static CatalogOptionResponse fromCategory(Category category) {
    return new CatalogOptionResponse(
        category.id(),
        category.name(),
        category.name(),
        category.name(),
        null,
        category.active(),
        category.systemDefault());
  }

  public static CatalogOptionResponse fromBrand(Brand brand) {
    return new CatalogOptionResponse(
        brand.id(),
        brand.name(),
        brand.name(),
        brand.name(),
        null,
        brand.active(),
        brand.systemDefault());
  }

  public static CatalogOptionResponse fromUnitOfMeasure(UnitOfMeasure unitOfMeasure) {
    return new CatalogOptionResponse(
        unitOfMeasure.id(),
        unitOfMeasure.label(),
        unitOfMeasure.acronym(),
        unitOfMeasure.name(),
        unitOfMeasure.acronym(),
        unitOfMeasure.active(),
        unitOfMeasure.systemDefault());
  }
}
