package com.smartstock.catalog.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCategoryRepository extends JpaRepository<CategoryJpaEntity, UUID> {

  List<CategoryJpaEntity> findByActiveTrueOrderByNameAsc();

  Optional<CategoryJpaEntity> findByNormalizedName(String normalizedName);
}
