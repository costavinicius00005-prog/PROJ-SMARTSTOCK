package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.UnitOfMeasureRepositoryPort;
import com.smartstock.catalog.domain.UnitOfMeasure;
import com.smartstock.catalog.infrastructure.persistence.jpa.SpringDataUnitOfMeasureRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresUnitOfMeasureRepositoryAdapter implements UnitOfMeasureRepositoryPort {

  private final SpringDataUnitOfMeasureRepository repository;

  public PostgresUnitOfMeasureRepositoryAdapter(SpringDataUnitOfMeasureRepository repository) {
    this.repository = repository;
  }

  @Override
  public List<UnitOfMeasure> listActive() {
    return repository.findByActiveTrueOrderByAcronymAsc().stream()
        .map(UnitOfMeasureJpaMapper::toDomain)
        .toList();
  }

  @Override
  public Optional<UnitOfMeasure> findById(UUID id) {
    return repository.findById(id).map(UnitOfMeasureJpaMapper::toDomain);
  }

  @Override
  public Optional<UnitOfMeasure> findByNormalizedAcronymOrName(String normalizedValue) {
    return repository.findFirstByNormalizedAcronymOrNormalizedName(normalizedValue, normalizedValue)
        .map(UnitOfMeasureJpaMapper::toDomain);
  }

  @Override
  public UnitOfMeasure save(
      UnitOfMeasure unitOfMeasure,
      String normalizedAcronym,
      String normalizedName) {
    return UnitOfMeasureJpaMapper.toDomain(repository.save(
        UnitOfMeasureJpaMapper.toEntity(unitOfMeasure, normalizedAcronym, normalizedName)));
  }
}
