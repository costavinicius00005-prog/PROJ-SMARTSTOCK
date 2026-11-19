package com.smartstock.catalog.infrastructure.persistence;

import com.smartstock.catalog.application.port.StockMovementRecorderPort;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class JdbcStockMovementRecorderAdapter implements StockMovementRecorderPort {

  private final JdbcTemplate jdbc;

  public JdbcStockMovementRecorderAdapter(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void recordInitialStock(UUID productId, BigDecimal quantity) {
    insert(productId, "ENTRADA", quantity, "Estoque inicial (cadastro do produto)");
  }

  @Override
  public void recordAdjustment(UUID productId, BigDecimal delta, String note) {
    insert(productId, "AJUSTE", delta, note);
  }

  private void insert(UUID productId, String type, BigDecimal quantity, String note) {
    jdbc.update("""
        INSERT INTO stock_movements (id, product_id, movement_type, quantity, note)
        VALUES (?, ?, ?, ?, ?)
        """, UUID.randomUUID(), productId, type, quantity, note);
  }
}
