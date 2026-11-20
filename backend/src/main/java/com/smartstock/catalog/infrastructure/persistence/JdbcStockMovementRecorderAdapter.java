package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.StockMovementRecorderPort;
import com.smartstock.iam.infrastructure.security.CurrentUserProvider;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class JdbcStockMovementRecorderAdapter implements StockMovementRecorderPort {

  private final JdbcTemplate jdbc;
  private final CurrentUserProvider currentUser;

  public JdbcStockMovementRecorderAdapter(JdbcTemplate jdbc, CurrentUserProvider currentUser) {
    this.jdbc = jdbc;
    this.currentUser = currentUser;
  }

  @Override
  public void recordInitialStock(UUID productId, BigDecimal quantity) {
    insert(productId, "ENTRADA", quantity, "Estoque inicial (cadastro do produto)", "ESTOQUE_INICIAL",
        "Cadastro de produto");
  }

  @Override
  public void recordAdjustment(UUID productId, BigDecimal delta, String note) {
    insert(productId, "AJUSTE", delta, note, "AJUSTE", "Edicao de produto");
  }

  private void insert(UUID productId, String type, BigDecimal quantity, String note, String reason, String origin) {
    jdbc.update("""
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, balance_after, note, reason,
          origin, created_by)
        VALUES (?, ?, ?, ?, (SELECT stock_quantity FROM products WHERE id = ?), ?, ?, ?, ?)
        """, UUID.randomUUID(), productId, type, quantity, productId, note, reason, origin,
        currentUser.currentUserName());
  }
}
