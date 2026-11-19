package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.application.port.StockMovementRecorderPort;
import com.smartstock.catalog.domain.Brand;
import com.smartstock.catalog.domain.Category;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.domain.UnitOfMeasure;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateProductUseCase {

  private final ProductRepositoryPort productRepository;
  private final ProductReferenceResolver referenceResolver;
  private final ProductCompositionService compositionService;
  private final StockMovementRecorderPort stockMovementRecorder;

  public CreateProductUseCase(
      ProductRepositoryPort productRepository,
      ProductReferenceResolver referenceResolver,
      ProductCompositionService compositionService,
      StockMovementRecorderPort stockMovementRecorder) {
    this.productRepository = productRepository;
    this.referenceResolver = referenceResolver;
    this.compositionService = compositionService;
    this.stockMovementRecorder = stockMovementRecorder;
  }

  @Transactional
  public Product execute(CreateProductCommand command) {
    Category category = referenceResolver.resolveCategory(command);
    Brand brand = referenceResolver.resolveBrand(command);
    UnitOfMeasure unitOfMeasure = referenceResolver.resolveUnitOfMeasure(command);
    // Kits nao tem estoque proprio: o saldo e calculado a partir dos componentes
    BigDecimal requestedStock = ProductStockInput.validate(command.stockQuantity());
    BigDecimal initialStock = requestedStock == null || ProductStockInput.hasComposition(command)
        ? BigDecimal.ZERO
        : requestedStock;

    Product product = new Product(
        UUID.randomUUID(),
        command.name(),
        category.id(),
        category.name(),
        brand.id(),
        brand.name(),
        command.internalCode(),
        command.variationType(),
        command.description(),
        unitOfMeasure.id(),
        unitOfMeasure.label(),
        command.costValue(),
        command.saleMarkup(),
        command.salePrice(),
        ProductInputSanitizer.blankToNull(command.barcode()),
        initialStock,
        BigDecimal.ZERO);

    Product saved = productRepository.save(product);
    compositionService.replace(saved.id(), command.composition());
    if (initialStock.signum() > 0) {
      stockMovementRecorder.recordInitialStock(saved.id(), initialStock);
    }
    return saved;
  }
}
