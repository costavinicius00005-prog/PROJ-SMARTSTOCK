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
public class UpdateProductUseCase {

  private final ProductRepositoryPort productRepository;
  private final ProductReferenceResolver referenceResolver;
  private final ProductCompositionService compositionService;
  private final StockMovementRecorderPort stockMovementRecorder;

  public UpdateProductUseCase(
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
  public Product execute(UUID productId, CreateProductCommand command) {
    Product current = productRepository.findById(productId)
        .orElseThrow(() -> new IllegalArgumentException("Produto nao encontrado."));

    Category category = referenceResolver.resolveCategory(command);
    Brand brand = referenceResolver.resolveBrand(command);
    UnitOfMeasure unitOfMeasure = referenceResolver.resolveUnitOfMeasure(command);
    // stockQuantity nulo = saldo nao alterado no formulario (preserva baixas feitas por vendas).
    // Kits nao tem estoque proprio, entao o valor informado e ignorado para eles.
    BigDecimal requestedStock = ProductStockInput.validate(command.stockQuantity());
    BigDecimal newStock = requestedStock == null || ProductStockInput.hasComposition(command)
        ? current.stockQuantity()
        : requestedStock;

    Product product = new Product(
        productId,
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
        newStock,
        current.reservedQuantity());

    Product saved = productRepository.save(product);
    compositionService.replace(productId, command.composition());
    BigDecimal delta = newStock.subtract(current.stockQuantity());
    if (delta.signum() != 0) {
      stockMovementRecorder.recordAdjustment(productId, delta, "Ajuste pela edicao do produto");
    }
    return saved;
  }
}
