package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.BrandRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.CatalogTextNormalizer;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateBrandUseCase {

  private final BrandRepositoryPort brandRepository;

  public CreateBrandUseCase(BrandRepositoryPort brandRepository) {
    this.brandRepository = brandRepository;
  }

  public Brand execute(String name) {
    String normalizedName = CatalogTextNormalizer.normalize(name);

    return brandRepository.findByNormalizedName(normalizedName)
        .orElseGet(() -> brandRepository.save(
            new Brand(UUID.randomUUID(), name.trim(), true, false),
            normalizedName));
  }
}
