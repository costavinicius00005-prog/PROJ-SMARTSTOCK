package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.UnitOfMeasureRepositoryPort;
import com.smartstock.catalog.domain.CatalogTextNormalizer;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateUnitOfMeasureUseCase {

  private final UnitOfMeasureRepositoryPort unitOfMeasureRepository;

  public CreateUnitOfMeasureUseCase(UnitOfMeasureRepositoryPort unitOfMeasureRepository) {
    this.unitOfMeasureRepository = unitOfMeasureRepository;
  }

  public UnitOfMeasure execute(String acronym, String name) {
    String cleanAcronym = acronym.trim().toUpperCase();
    String cleanName = name == null || name.isBlank() ? cleanAcronym : name.trim();
    String normalizedAcronym = CatalogTextNormalizer.normalize(cleanAcronym);
    String normalizedName = CatalogTextNormalizer.normalize(cleanName);

    return unitOfMeasureRepository.findByNormalizedAcronymOrName(normalizedAcronym)
        .or(() -> unitOfMeasureRepository.findByNormalizedAcronymOrName(normalizedName))
        .orElseGet(() -> unitOfMeasureRepository.save(
            new UnitOfMeasure(UUID.randomUUID(), cleanAcronym, cleanName, true, false),
            normalizedAcronym,
            normalizedName));
  }
}
