package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateProductUseCase {

  private final ProductRepositoryPort productRepository;
  private final ProductReferenceResolver referenceResolver;
  private final ProductCompositionService compositionService;

  public CreateProductUseCase(
      ProductRepositoryPort productRepository,
      ProductReferenceResolver referenceResolver,
      ProductCompositionService compositionService) {
    this.productRepository = productRepository;
    this.referenceResolver = referenceResolver;
    this.compositionService = compositionService;
  }

  @Transactional
  public Product execute(CreateProductCommand command) {
    Category category = referenceResolver.resolveCategory(command);
    Brand brand = referenceResolver.resolveBrand(command);
    UnitOfMeasure unitOfMeasure = referenceResolver.resolveUnitOfMeasure(command);

    Product product = new Product(
        UUID.randomUUID(),
        command.name(),
        category.id(),
        category.name(),
        brand.id(),
        brand.name(),
        command.internalCode(),
        command.variationType(),
        command.description(),
        unitOfMeasure.id(),
        unitOfMeasure.label(),
        command.costValue(),
        command.saleMarkup(),
        command.salePrice(),
        ProductInputSanitizer.blankToNull(command.barcode()),
        java.math.BigDecimal.ZERO,
        java.math.BigDecimal.ZERO);

    Product saved = productRepository.save(product);
    compositionService.replace(saved.id(), command.composition());
    return saved;
  }
}
