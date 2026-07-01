package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.domain.UnitOfMeasure;
import com.smartstock.catalog.infrastructure.persistence.jpa.UnitOfMeasureJpaEntity;
import java.time.OffsetDateTime;

public final class UnitOfMeasureJpaMapper {

  private UnitOfMeasureJpaMapper() {
  }

  public static UnitOfMeasureJpaEntity toEntity(
      UnitOfMeasure unitOfMeasure,
      String normalizedAcronym,
      String normalizedName) {
    OffsetDateTime now = OffsetDateTime.now();

    return new UnitOfMeasureJpaEntity(
        unitOfMeasure.id(),
        unitOfMeasure.acronym(),
        unitOfMeasure.name(),
        normalizedAcronym,
        normalizedName,
        unitOfMeasure.active(),
        unitOfMeasure.systemDefault(),
        now,
        now);
  }

  public static UnitOfMeasure toDomain(UnitOfMeasureJpaEntity entity) {
    return new UnitOfMeasure(
        entity.getId(),
        entity.getAcronym(),
        entity.getName(),
        entity.isActive(),
        entity.isSystemDefault());
  }
}
