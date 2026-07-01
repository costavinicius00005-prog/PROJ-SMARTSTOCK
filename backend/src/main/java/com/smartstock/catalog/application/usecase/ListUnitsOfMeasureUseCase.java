package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.UnitOfMeasureRepositoryPort;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListUnitsOfMeasureUseCase {

  private final UnitOfMeasureRepositoryPort unitOfMeasureRepository;

  public ListUnitsOfMeasureUseCase(UnitOfMeasureRepositoryPort unitOfMeasureRepository) {
    this.unitOfMeasureRepository = unitOfMeasureRepository;
  }

  public List<UnitOfMeasure> execute() {
    return unitOfMeasureRepository.listActive();
  }
}
