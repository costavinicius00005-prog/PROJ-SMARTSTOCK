package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.infrastructure.persistence.jpa.BrandJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.CategoryJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.ProductJpaEntity;
import com.smartstock.catalog.infrastructure.persistence.jpa.SpringDataProductRepository;
import com.smartstock.catalog.infrastructure.persistence.jpa.UnitOfMeasureJpaEntity;
import jakarta.persistence.EntityManager;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PostgresProductRepositoryAdapter implements ProductRepositoryPort {

  private final SpringDataProductRepository repository;
  private final EntityManager entityManager;

  public PostgresProductRepositoryAdapter(
      SpringDataProductRepository repository,
      EntityManager entityManager) {
    this.repository = repository;
    this.entityManager = entityManager;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Product> list() {
    return repository.findAll().stream()
        .map(ProductJpaMapper::toDomain)
        .sorted(Comparator.comparing(Product::name))
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Product> findById(UUID id) {
    return repository.findById(id).map(ProductJpaMapper::toDomain);
  }

  @Override
  @Transactional
  public Optional<Product> findByIdForUpdate(UUID id) {
    return entityManager.createQuery("select p from ProductJpaEntity p where p.id = :id", ProductJpaEntity.class)
        .setParameter("id", id).setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        .getResultStream().findFirst().map(ProductJpaMapper::toDomain);
  }

  @Override
  @Transactional
  public void updateStock(UUID id, java.math.BigDecimal quantity) {
    entityManager.createQuery("update ProductJpaEntity p set p.stockQuantity = :quantity, p.updatedAt = :now where p.id = :id")
        .setParameter("quantity", quantity).setParameter("now", OffsetDateTime.now()).setParameter("id", id).executeUpdate();
  }

  @Override
  @Transactional
  public Product save(Product product) {
    CategoryJpaEntity category = entityManager.getReference(CategoryJpaEntity.class, product.categoryId());
    BrandJpaEntity brand = entityManager.getReference(BrandJpaEntity.class, product.brandId());
    UnitOfMeasureJpaEntity unitOfMeasure =
        entityManager.getReference(UnitOfMeasureJpaEntity.class, product.unitOfMeasureId());
    ProductJpaEntity existingEntity = repository.findById(product.id()).orElse(null);
    ProductJpaEntity entity = existingEntity == null
        ? ProductJpaMapper.toEntity(product, category, brand, unitOfMeasure)
        : ProductJpaMapper.toEntity(
            product,
            category,
            brand,
            unitOfMeasure,
            existingEntity.getCreatedAt(),
            OffsetDateTime.now());
    ProductJpaEntity savedEntity = repository.save(entity);

    return ProductJpaMapper.toDomain(savedEntity);
  }

  @Override
  @Transactional
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }
}
