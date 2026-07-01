package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.Brand;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BrandRepositoryPort {

  List<Brand> listActive();

  Optional<Brand> findById(UUID id);

  Optional<Brand> findByNormalizedName(String normalizedName);

  Brand save(Brand brand, String normalizedName);
}
