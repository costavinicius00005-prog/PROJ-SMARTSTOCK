package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UpdateProductUseCase {

  private final ProductRepositoryPort productRepository;
  private final ProductReferenceResolver referenceResolver;

  public UpdateProductUseCase(
      ProductRepositoryPort productRepository,
      ProductReferenceResolver referenceResolver) {
    this.productRepository = productRepository;
    this.referenceResolver = referenceResolver;
  }

  public Product execute(UUID productId, CreateProductCommand command) {
    productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));

    Category category = referenceResolver.resolveCategory(command);
    Brand brand = referenceResolver.resolveBrand(command);
    UnitOfMeasure unitOfMeasure = referenceResolver.resolveUnitOfMeasure(command);

    Product product = new Product(
        productId,
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
        ProductInputSanitizer.blankToNull(command.barcode()));

    return productRepository.save(product);
  }
}
