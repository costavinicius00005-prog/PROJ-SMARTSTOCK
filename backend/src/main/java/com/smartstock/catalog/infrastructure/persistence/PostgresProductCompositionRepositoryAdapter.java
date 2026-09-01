package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.ProductCompositionRepositoryPort;
import com.smartstock.catalog.domain.ProductComponent;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresProductCompositionRepositoryAdapter implements ProductCompositionRepositoryPort {
  private final JdbcTemplate jdbc;

  public PostgresProductCompositionRepositoryAdapter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  @Override
  public List<ProductComponent> findByParentId(UUID parentId) {
    return jdbc.query(
        "SELECT component_product_id, quantity FROM product_compositions WHERE parent_product_id = ? ORDER BY created_at",
        (rs, row) -> map(rs), parentId);
  }

  private ProductComponent map(ResultSet rs) throws SQLException {
    return new ProductComponent(rs.getObject("component_product_id", UUID.class), rs.getBigDecimal("quantity"));
  }

  @Override
  public void replace(UUID parentId, List<ProductComponent> components) {
    jdbc.update("DELETE FROM product_compositions WHERE parent_product_id = ?", parentId);
    for (ProductComponent component : components) {
      jdbc.update("INSERT INTO product_compositions (id, parent_product_id, component_product_id, quantity) VALUES (?, ?, ?, ?)",
          UUID.randomUUID(), parentId, component.productId(), component.quantity());
    }
  }
}
