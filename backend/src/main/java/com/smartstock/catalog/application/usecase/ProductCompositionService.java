package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.ProductCompositionRepositoryPort;
import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.ProductComponent;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ProductCompositionService {
  private final ProductCompositionRepositoryPort compositions;
  private final ProductRepositoryPort products;

  public ProductCompositionService(ProductCompositionRepositoryPort compositions, ProductRepositoryPort products) {
    this.compositions = compositions;
    this.products = products;
  }

  public List<ProductComponent> find(UUID parentId) { return compositions.findByParentId(parentId); }

  public void replace(UUID parentId, List<ProductComponent> requested) {
    List<ProductComponent> components = requested == null ? List.of() : List.copyOf(requested);
    Set<UUID> unique = new HashSet<>();
    for (ProductComponent component : components) {
      if (parentId.equals(component.productId())) throw new IllegalArgumentException("Um produto nao pode conter a si mesmo.");
      if (!unique.add(component.productId())) throw new IllegalArgumentException("O mesmo componente nao pode ser adicionado duas vezes.");
      products.findById(component.productId()).orElseThrow(() -> new IllegalArgumentException("Produto componente nao encontrado."));
      if (reaches(component.productId(), parentId, new HashSet<>())) {
        throw new IllegalArgumentException("A composicao informada cria um ciclo entre produtos.");
      }
    }
    compositions.replace(parentId, components);
  }

  private boolean reaches(UUID current, UUID target, Set<UUID> visited) {
    if (current.equals(target)) return true;
    if (!visited.add(current)) return false;
    return compositions.findByParentId(current).stream()
        .anyMatch(child -> reaches(child.productId(), target, visited));
  }
}
