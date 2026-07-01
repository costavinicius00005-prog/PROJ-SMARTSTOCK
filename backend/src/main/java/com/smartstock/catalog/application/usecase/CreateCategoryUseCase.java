package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.CategoryRepositoryPort;
import com.smartstock.catalog.domain.CatalogTextNormalizer;
import com.smartstock.catalog.domain.Category;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateCategoryUseCase {

  private final CategoryRepositoryPort categoryRepository;

  public CreateCategoryUseCase(CategoryRepositoryPort categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  public Category execute(String name) {
    String normalizedName = CatalogTextNormalizer.normalize(name);

    return categoryRepository.findByNormalizedName(normalizedName)
        .orElseGet(() -> categoryRepository.save(
            new Category(UUID.randomUUID(), name.trim(), true, false),
            normalizedName));
  }
}
