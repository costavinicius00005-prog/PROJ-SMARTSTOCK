package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.ProductComponent;
import java.util.List;
import java.util.UUID;

public interface ProductCompositionRepositoryPort {
  List<ProductComponent> findByParentId(UUID parentId);
  void replace(UUID parentId, List<ProductComponent> components);
}
