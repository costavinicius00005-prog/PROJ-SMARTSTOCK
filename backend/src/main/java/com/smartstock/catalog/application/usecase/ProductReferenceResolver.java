package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.BrandRepositoryPort;
import com.smartstock.catalog.application.port.CategoryRepositoryPort;
import com.smartstock.catalog.application.port.UnitOfMeasureRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.CatalogTextNormalizer;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProductReferenceResolver {

  private final CategoryRepositoryPort categoryRepository;
  private final BrandRepositoryPort brandRepository;
  private final UnitOfMeasureRepositoryPort unitOfMeasureRepository;

  public ProductReferenceResolver(
      CategoryRepositoryPort categoryRepository,
      BrandRepositoryPort brandRepository,
      UnitOfMeasureRepositoryPort unitOfMeasureRepository) {
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
    this.unitOfMeasureRepository = unitOfMeasureRepository;
  }

  public Category resolveCategory(CreateProductCommand command) {
    if (command.categoryId() != null) {
      return categoryRepository.findById(command.categoryId())
          .orElseThrow(() -> new IllegalArgumentException("Categoria nao encontrada."));
    }

    String normalizedName = CatalogTextNormalizer.normalize(command.category());

    return categoryRepository.findByNormalizedName(normalizedName)
        .orElseGet(() -> categoryRepository.save(
            new Category(UUID.randomUUID(), command.category().trim(), true, false),
            normalizedName));
  }

  public Brand resolveBrand(CreateProductCommand command) {
    if (command.brandId() != null) {
      return brandRepository.findById(command.brandId())
          .orElseThrow(() -> new IllegalArgumentException("Marca nao encontrada."));
    }

    String brandName = command.brand() == null || command.brand().isBlank()
        ? "Sem marca"
        : command.brand().trim();
    String normalizedName = CatalogTextNormalizer.normalize(brandName);

    return brandRepository.findByNormalizedName(normalizedName)
        .orElseGet(() -> brandRepository.save(
            new Brand(UUID.randomUUID(), brandName, true, false),
            normalizedName));
  }

  public UnitOfMeasure resolveUnitOfMeasure(CreateProductCommand command) {
    if (command.unitOfMeasureId() != null) {
      return unitOfMeasureRepository.findById(command.unitOfMeasureId())
          .orElseThrow(() -> new IllegalArgumentException("Unidade de medida nao encontrada."));
    }

    String acronym = command.unitOfMeasure().trim().toUpperCase();
    String normalizedValue = CatalogTextNormalizer.normalize(acronym);

    return unitOfMeasureRepository.findByNormalizedAcronymOrName(normalizedValue)
        .orElseGet(() -> unitOfMeasureRepository.save(
            new UnitOfMeasure(UUID.randomUUID(), acronym, acronym, true, false),
            normalizedValue,
            normalizedValue));
  }
}
