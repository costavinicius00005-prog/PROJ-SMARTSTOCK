package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.domain.ProductComponent;
import com.smartstock.catalog.domain.ProductCompositionItem;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetProductCompositionUseCase {
  private final ProductCompositionService compositions;
  private final ProductRepositoryPort products;

  public GetProductCompositionUseCase(ProductCompositionService compositions, ProductRepositoryPort products) {
    this.compositions = compositions;
    this.products = products;
  }

  public List<ProductCompositionItem> items(UUID parentId) {
    return compositions.find(parentId).stream().map(component -> {
      Product product = get(component.productId());
      BigDecimal available = availability(product.id(), new HashSet<>());
      return new ProductCompositionItem(product.id(), product.internalCode(), product.name(),
          product.unitOfMeasure(), component.quantity(), available,
          available.divide(component.quantity(), 0, RoundingMode.FLOOR), estimatedCost(product.id(), new HashSet<>()));
    }).toList();
  }

  public BigDecimal availability(UUID productId) { return availability(productId, new HashSet<>()); }

  public BigDecimal estimatedCost(UUID productId) { return estimatedCost(productId, new HashSet<>()); }

  public Map<UUID, BigDecimal> expandToStockProducts(UUID productId, BigDecimal quantity) {
    Map<UUID, BigDecimal> result = new HashMap<>();
    expand(productId, quantity, result, new HashSet<>());
    return Map.copyOf(result);
  }

  private BigDecimal availability(UUID productId, Set<UUID> path) {
    Product product = get(productId);
    List<ProductComponent> children = compositions.find(productId);
    if (children.isEmpty()) return product.stockQuantity().subtract(product.reservedQuantity()).max(BigDecimal.ZERO);
    guard(path, productId);
    try {
      return children.stream().map(child -> availability(child.productId(), path)
          .divide(child.quantity(), 0, RoundingMode.FLOOR)).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    } finally { path.remove(productId); }
  }

  private BigDecimal estimatedCost(UUID productId, Set<UUID> path) {
    Product product = get(productId);
    List<ProductComponent> children = compositions.find(productId);
    if (children.isEmpty()) return product.costValue();
    guard(path, productId);
    try {
      return children.stream().map(child -> estimatedCost(child.productId(), path).multiply(child.quantity()))
          .reduce(BigDecimal.ZERO, BigDecimal::add);
    } finally { path.remove(productId); }
  }

  private void expand(UUID productId, BigDecimal multiplier, Map<UUID, BigDecimal> result, Set<UUID> path) {
    List<ProductComponent> children = compositions.find(productId);
    if (children.isEmpty()) { result.merge(productId, multiplier, BigDecimal::add); return; }
    guard(path, productId);
    try {
      children.forEach(child -> expand(child.productId(), multiplier.multiply(child.quantity()), result, path));
    } finally { path.remove(productId); }
  }

  private void guard(Set<UUID> path, UUID id) {
    if (!path.add(id)) throw new IllegalStateException("Ciclo detectado na composicao de produtos.");
  }

  private Product get(UUID id) {
    return products.findById(id).orElseThrow(() -> new IllegalArgumentException("Produto componente nao encontrado."));
  }
}
