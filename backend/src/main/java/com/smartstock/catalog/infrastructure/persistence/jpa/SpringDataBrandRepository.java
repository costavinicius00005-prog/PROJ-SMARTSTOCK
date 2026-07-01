package com.smartstock.catalog.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataBrandRepository extends JpaRepository<BrandJpaEntity, UUID> {

  List<BrandJpaEntity> findByActiveTrueOrderByNameAsc();

  Optional<BrandJpaEntity> findByNormalizedName(String normalizedName);
}
