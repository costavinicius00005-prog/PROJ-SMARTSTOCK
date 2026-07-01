package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.CategoryRepositoryPort;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.infrastructure.persistence.jpa.SpringDataCategoryRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresCategoryRepositoryAdapter implements CategoryRepositoryPort {

  private final SpringDataCategoryRepository repository;

  public PostgresCategoryRepositoryAdapter(SpringDataCategoryRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Category> listActive() {
    return repository.findByActiveTrueOrderByNameAsc().stream()
        .map(CategoryJpaMapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Category> findById(UUID id) {
    return repository.findById(id).map(CategoryJpaMapper::toDomain);
  }

  @Override
  public Optional<Category> findByNormalizedName(String normalizedName) {
    return repository.findByNormalizedName(normalizedName).map(CategoryJpaMapper::toDomain);
  }

  @Override
  public Category save(Category category, String normalizedName) {
    return CategoryJpaMapper.toDomain(repository.save(CategoryJpaMapper.toEntity(category, normalizedName)));
  }
}
