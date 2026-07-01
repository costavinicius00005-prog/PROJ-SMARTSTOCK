package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.infrastructure.persistence.jpa.CategoryJpaEntity;
import java.time.OffsetDateTime;

public final class CategoryJpaMapper {

  private CategoryJpaMapper() {
  }

  public static CategoryJpaEntity toEntity(Category category, String normalizedName) {
    OffsetDateTime now = OffsetDateTime.now();

    return new CategoryJpaEntity(
        category.id(),
        category.name(),
        normalizedName,
        category.active(),
        category.systemDefault(),
        now,
        now);
  }

  public static Category toDomain(CategoryJpaEntity entity) {
    return new Category(
        entity.getId(),
        entity.getName(),
        entity.isActive(),
        entity.isSystemDefault());
  }
}
