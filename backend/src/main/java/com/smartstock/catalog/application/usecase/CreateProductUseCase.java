package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateProductUseCase {

  private final ProductRepositoryPort productRepository;

  public CreateProductUseCase(ProductRepositoryPort productRepository) {
    this.productRepository = productRepository;
  }

  public Product execute(CreateProductCommand command) {
    Product product = new Product(
        UUID.randomUUID(),
        command.name(),
        command.category(),
        command.brand(),
        command.internalCode(),
        command.variationType(),
        command.description(),
        command.unitOfMeasure(),
        command.costValue(),
        command.saleMarkup(),
        command.salePrice(),
        command.barcode());

    return productRepository.save(product);
  }
}
