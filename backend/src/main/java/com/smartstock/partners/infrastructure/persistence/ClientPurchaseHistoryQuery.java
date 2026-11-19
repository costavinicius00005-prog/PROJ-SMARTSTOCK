package com.smartstock.partners.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Consulta de leitura que reune orcamentos, pedidos e vendas de um cliente. */
@Component
public class ClientPurchaseHistoryQuery {

  public record Entry(
      String kind, UUID id, long number, OffsetDateTime date, String status, BigDecimal total) {
  }

  private final JdbcTemplate jdbc;

  public ClientPurchaseHistoryQuery(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public List<Entry> find(UUID clientId) {
    return jdbc.query("""
        SELECT 'VENDA' AS kind, id, number, created_at AS date, status, total
          FROM sales WHERE client_id = ?
        UNION ALL
        SELECT 'PEDIDO', id, number, created_at, status, total
          FROM sales_orders WHERE client_id = ?
        UNION ALL
        SELECT 'ORCAMENTO', id, number, created_at, status, total
          FROM sales_quotes WHERE client_id = ?
        ORDER BY date DESC
        LIMIT 500
        """,
        (rs, row) -> new Entry(
            rs.getString("kind"),
            rs.getObject("id", UUID.class),
            rs.getLong("number"),
            rs.getObject("date", OffsetDateTime.class),
            rs.getString("status"),
            rs.getBigDecimal("total")),
        clientId, clientId, clientId);
  }
}
