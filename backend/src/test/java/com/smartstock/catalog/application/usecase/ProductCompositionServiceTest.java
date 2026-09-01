package com.smartstock.catalog.application.usecase;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartstock.catalog.application.port.ProductCompositionRepositoryPort;
import com.smartstock.catalog.application.port.ProductRepositoryPort;
import com.smartstock.catalog.domain.Product;
import com.smartstock.catalog.domain.ProductComponent;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductCompositionServiceTest {
  @Mock ProductCompositionRepositoryPort compositions;
  @Mock ProductRepositoryPort products;
  ProductCompositionService service;

  @BeforeEach void setUp() { service = new ProductCompositionService(compositions, products); }

  @Test void savesAValidComposition() {
    UUID parent = UUID.randomUUID();
    UUID child = UUID.randomUUID();
    ProductComponent component = new ProductComponent(child, BigDecimal.TEN);
    when(products.findById(child)).thenReturn(Optional.of(product(child)));
    when(compositions.findByParentId(child)).thenReturn(List.of());

    service.replace(parent, List.of(component));

    verify(compositions).replace(parent, List.of(component));
  }

  @Test void rejectsSelfReferenceAndDuplicateAndInvalidQuantity() {
    UUID product = UUID.randomUUID();
    assertThrows(IllegalArgumentException.class,
        () -> service.replace(product, List.of(new ProductComponent(product, BigDecimal.ONE))));
    assertThrows(IllegalArgumentException.class, () -> new ProductComponent(product, BigDecimal.ZERO));

    UUID child = UUID.randomUUID();
    ProductComponent repeated = new ProductComponent(child, BigDecimal.ONE);
    when(products.findById(child)).thenReturn(Optional.of(product(child)));
    when(compositions.findByParentId(child)).thenReturn(List.of());
    assertThrows(IllegalArgumentException.class, () -> service.replace(product, List.of(repeated, repeated)));
  }

  @Test void rejectsIndirectCycle() {
    UUID parent = UUID.randomUUID();
    UUID child = UUID.randomUUID();
    UUID grandchild = UUID.randomUUID();
    when(products.findById(child)).thenReturn(Optional.of(product(child)));
    when(compositions.findByParentId(child))
        .thenReturn(List.of(new ProductComponent(grandchild, BigDecimal.ONE)));
    when(compositions.findByParentId(grandchild))
        .thenReturn(List.of(new ProductComponent(parent, BigDecimal.ONE)));

    assertThrows(IllegalArgumentException.class,
        () -> service.replace(parent, List.of(new ProductComponent(child, BigDecimal.ONE))));
  }

  private Product product(UUID id) {
    return new Product(id, "Produto", UUID.randomUUID(), "Categoria", UUID.randomUUID(), "Marca",
        id.toString(), "Produto simples", "", UUID.randomUUID(), "UN - Unidade",
        BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ONE, null, BigDecimal.TEN, BigDecimal.ZERO);
  }
}
