package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.Product;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepositoryPort {

  List<Product> list();

  Optional<Product> findById(UUID id);

  Product save(Product product);

  void deleteById(UUID id);
}
