package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DeleteProductUseCase {

  private final ProductRepositoryPort productRepository;

  public DeleteProductUseCase(ProductRepositoryPort productRepository) {
    this.productRepository = productRepository;
  }

  public void execute(UUID productId) {
    productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));

    productRepository.deleteById(productId);
  }
}
