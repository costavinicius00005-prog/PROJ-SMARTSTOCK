package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnitOfMeasureRepositoryPort {

  List<UnitOfMeasure> listActive();

  Optional<UnitOfMeasure> findById(UUID id);

  Optional<UnitOfMeasure> findByNormalizedAcronymOrName(String normalizedValue);

  UnitOfMeasure save(UnitOfMeasure unitOfMeasure, String normalizedAcronym, String normalizedName);
}
