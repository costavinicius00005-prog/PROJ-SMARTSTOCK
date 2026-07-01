package com.smartstock.catalog.infrastructure.web;

import com.smartstock.catalog.application.usecase.CreateProductCommand;
import com.smartstock.catalog.application.usecase.CreateProductUseCase;
import com.smartstock.catalog.application.usecase.DeleteProductUseCase;
import com.smartstock.catalog.application.usecase.GetProductUseCase;
import com.smartstock.catalog.application.usecase.ListProductsUseCase;
import com.smartstock.catalog.application.usecase.UpdateProductUseCase;
import com.smartstock.catalog.domain.Product;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

  private final CreateProductUseCase createProductUseCase;
  private final ListProductsUseCase listProductsUseCase;
  private final GetProductUseCase getProductUseCase;
  private final UpdateProductUseCase updateProductUseCase;
  private final DeleteProductUseCase deleteProductUseCase;

  public ProductController(
      CreateProductUseCase createProductUseCase,
      ListProductsUseCase listProductsUseCase,
      GetProductUseCase getProductUseCase,
      UpdateProductUseCase updateProductUseCase,
      DeleteProductUseCase deleteProductUseCase) {
    this.createProductUseCase = createProductUseCase;
    this.listProductsUseCase = listProductsUseCase;
    this.getProductUseCase = getProductUseCase;
    this.updateProductUseCase = updateProductUseCase;
    this.deleteProductUseCase = deleteProductUseCase;
  }

  @GetMapping
  public List<ProductResponse> list() {
    return listProductsUseCase.execute().stream()
        .map(ProductResponse::fromDomain)
        .toList();
  }

  @GetMapping("/{productId}")
  public ProductResponse get(@PathVariable UUID productId) {
    return ProductResponse.fromDomain(getProductUseCase.execute(productId));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse create(@RequestBody CreateProductRequest request) {
    Product product = createProductUseCase.execute(toCommand(request));

    return ProductResponse.fromDomain(product);
  }

  @PutMapping("/{productId}")
  public ProductResponse update(
      @PathVariable UUID productId,
      @RequestBody CreateProductRequest request) {
    Product product = updateProductUseCase.execute(productId, toCommand(request));

    return ProductResponse.fromDomain(product);
  }

  @DeleteMapping("/{productId}")
  public ResponseEntity<Void> delete(@PathVariable UUID productId) {
    deleteProductUseCase.execute(productId);

    return ResponseEntity.noContent().build();
  }

  private CreateProductCommand toCommand(CreateProductRequest request) {
    return new CreateProductCommand(
        request.name(),
        request.categoryId(),
        request.category(),
        request.brandId(),
        request.brand(),
        request.internalCode(),
        request.variationType(),
        request.description(),
        request.unitOfMeasureId(),
        request.unitOfMeasure(),
        request.costValue(),
        request.saleMarkup(),
        request.salePrice(),
        request.barcode());
  }
}
