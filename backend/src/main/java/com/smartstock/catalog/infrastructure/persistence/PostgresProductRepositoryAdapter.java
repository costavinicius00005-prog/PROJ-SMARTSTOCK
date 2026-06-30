package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.infrastructure.persistence.jpa.ProductJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.SpringDataProductRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresProductRepositoryAdapter implements ProductRepositoryPort {

  private final SpringDataProductRepository repository;

  public PostgresProductRepositoryAdapter(SpringDataProductRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<Product> list() {
    return repository.findAll().stream()
        .map(ProductJpaMapper::toDomain)
        .sorted(Comparator.comparing(Product::name))
        .toList();
  }

  @Override
  public Product save(Product product) {
    ProductJpaEntity entity = ProductJpaMapper.toEntity(product);
    ProductJpaEntity savedEntity = repository.save(entity);

    return ProductJpaMapper.toDomain(savedEntity);
  }
}
