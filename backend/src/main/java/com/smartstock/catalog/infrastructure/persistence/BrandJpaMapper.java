package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.infrastructure.persistence.jpa.BrandJpaEntity;
import java.time.OffsetDateTime;

public final class BrandJpaMapper {

  private BrandJpaMapper() {
  }

  public static BrandJpaEntity toEntity(Brand brand, String normalizedName) {
    OffsetDateTime now = OffsetDateTime.now();

    return new BrandJpaEntity(
        brand.id(),
        brand.name(),
        normalizedName,
        brand.active(),
        brand.systemDefault(),
        now,
        now);
  }

  public static Brand toDomain(BrandJpaEntity entity) {
    return new Brand(
        entity.getId(),
        entity.getName(),
        entity.isActive(),
        entity.isSystemDefault());
  }
}
