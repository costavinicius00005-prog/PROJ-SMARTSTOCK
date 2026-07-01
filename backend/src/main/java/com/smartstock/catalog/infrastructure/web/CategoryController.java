package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.application.usecase.CreateCategoryUseCase;
import com.smartstock.catalog.application.usecase.ListCategoriesUseCase;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

  private final ListCategoriesUseCase listCategoriesUseCase;
  private final CreateCategoryUseCase createCategoryUseCase;

  public CategoryController(
      ListCategoriesUseCase listCategoriesUseCase,
      CreateCategoryUseCase createCategoryUseCase) {
    this.listCategoriesUseCase = listCategoriesUseCase;
    this.createCategoryUseCase = createCategoryUseCase;
  }

  @GetMapping
  public List<CatalogOptionResponse> list() {
    return listCategoriesUseCase.execute().stream()
        .map(CatalogOptionResponse::fromCategory)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CatalogOptionResponse create(@RequestBody CreateCatalogOptionRequest request) {
    return CatalogOptionResponse.fromCategory(createCategoryUseCase.execute(request.name()));
  }
}
