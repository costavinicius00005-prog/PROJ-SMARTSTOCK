package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.application.usecase.CreateBrandUseCase;
import com.smartstock.catalog.application.usecase.ListBrandsUseCase;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

  private final ListBrandsUseCase listBrandsUseCase;
  private final CreateBrandUseCase createBrandUseCase;

  public BrandController(ListBrandsUseCase listBrandsUseCase, CreateBrandUseCase createBrandUseCase) {
    this.listBrandsUseCase = listBrandsUseCase;
    this.createBrandUseCase = createBrandUseCase;
  }

  @GetMapping
  public List<CatalogOptionResponse> list() {
    return listBrandsUseCase.execute().stream()
        .map(CatalogOptionResponse::fromBrand)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CatalogOptionResponse create(@RequestBody CreateCatalogOptionRequest request) {
    return CatalogOptionResponse.fromBrand(createBrandUseCase.execute(request.name()));
  }
}
