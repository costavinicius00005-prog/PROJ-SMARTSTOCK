package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListProductsUseCase {

  private final ProductRepositoryPort productRepository;

  public ListProductsUseCase(ProductRepositoryPort productRepository) {
    this.productRepository = productRepository;
  }

  public List<Product> execute() {
    return productRepository.list();
  }
}
