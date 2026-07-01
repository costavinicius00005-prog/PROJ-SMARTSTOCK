package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.BrandRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.infrastructure.persistence.jpa.SpringDataBrandRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresBrandRepositoryAdapter implements BrandRepositoryPort {

  private final SpringDataBrandRepository repository;

  public PostgresBrandRepositoryAdapter(SpringDataBrandRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Brand> listActive() {
    return repository.findByActiveTrueOrderByNameAsc().stream()
        .map(BrandJpaMapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Brand> findById(UUID id) {
    return repository.findById(id).map(BrandJpaMapper::toDomain);
  }

  @Override
  public Optional<Brand> findByNormalizedName(String normalizedName) {
    return repository.findByNormalizedName(normalizedName).map(BrandJpaMapper::toDomain);
  }

  @Override
  public Brand save(Brand brand, String normalizedName) {
    return BrandJpaMapper.toDomain(repository.save(BrandJpaMapper.toEntity(brand, normalizedName)));
  }
}
