package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetProductUseCase {

  private final ProductRepositoryPort productRepository;

  public GetProductUseCase(ProductRepositoryPort productRepository) {
    this.productRepository = productRepository;
  }

  public Product execute(UUID productId) {
    return productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));
  }
}
