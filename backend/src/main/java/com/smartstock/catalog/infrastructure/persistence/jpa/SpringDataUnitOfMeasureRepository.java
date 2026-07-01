package com.smartstock.catalog.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataUnitOfMeasureRepository extends JpaRepository<UnitOfMeasureJpaEntity, UUID> {

  List<UnitOfMeasureJpaEntity> findByActiveTrueOrderByAcronymAsc();

  Optional<UnitOfMeasureJpaEntity> findFirstByNormalizedAcronymOrNormalizedName(
      String normalizedAcronym,
      String normalizedName);
}
