package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.application.usecase.CreateUnitOfMeasureUseCase;
import com.smartstock.catalog.application.usecase.ListUnitsOfMeasureUseCase;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/units-of-measure")
public class UnitOfMeasureController {

  private final ListUnitsOfMeasureUseCase listUnitsOfMeasureUseCase;
  private final CreateUnitOfMeasureUseCase createUnitOfMeasureUseCase;

  public UnitOfMeasureController(
      ListUnitsOfMeasureUseCase listUnitsOfMeasureUseCase,
      CreateUnitOfMeasureUseCase createUnitOfMeasureUseCase) {
    this.listUnitsOfMeasureUseCase = listUnitsOfMeasureUseCase;
    this.createUnitOfMeasureUseCase = createUnitOfMeasureUseCase;
  }

  @GetMapping
  public List<CatalogOptionResponse> list() {
    return listUnitsOfMeasureUseCase.execute().stream()
        .map(CatalogOptionResponse::fromUnitOfMeasure)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CatalogOptionResponse create(@RequestBody CreateCatalogOptionRequest request) {
    return CatalogOptionResponse.fromUnitOfMeasure(
        createUnitOfMeasureUseCase.execute(request.acronym(), request.name()));
  }
}
