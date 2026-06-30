package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.application.usecase.CreateProductCommand;
import com.smartstock.catalog.application.usecase.CreateProductUseCase;
import com.smartstock.catalog.application.usecase.ListProductsUseCase;
import com.smartstock.catalog.domain.Product;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final CreateProductUseCase createProductUseCase;
  private final ListProductsUseCase listProductsUseCase;

  public ProductController(
      CreateProductUseCase createProductUseCase,
      ListProductsUseCase listProductsUseCase) {
    this.createProductUseCase = createProductUseCase;
    this.listProductsUseCase = listProductsUseCase;
  }

  @GetMapping
  public List<ProductResponse> list() {
    return listProductsUseCase.execute().stream()
        .map(ProductResponse::fromDomain)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse create(@RequestBody CreateProductRequest request) {
    Product product = createProductUseCase.execute(new CreateProductCommand(
        request.name(),
        request.category(),
        request.brand(),
        request.internalCode(),
        request.variationType(),
        request.description(),
        request.unitOfMeasure(),
        request.costValue(),
        request.saleMarkup(),
        request.salePrice(),
        request.barcode()));

    return ProductResponse.fromDomain(product);
  }
}
