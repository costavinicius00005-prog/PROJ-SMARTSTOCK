package com.smartstock.sales.infrastructure.persistence;

import com.smartstock.sales.application.port.SalesDocumentRepositoryPort;
import com.smartstock.sales.domain.SalesDocumentItem;
import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesOrderStatus;
import com.smartstock.sales.domain.SalesQuote;
import com.smartstock.sales.domain.SalesQuoteStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresSalesDocumentRepositoryAdapter implements SalesDocumentRepositoryPort {
  private static final String QUOTE_SELECT = """
      SELECT q.*, o.id AS order_id, o.number AS order_number
      FROM sales_quotes q LEFT JOIN sales_orders o ON o.source_quote_id = q.id
      """;
  private static final String ORDER_SELECT = """
      SELECT o.*, q.number AS quote_number FROM sales_orders o
      JOIN sales_quotes q ON q.id = o.source_quote_id
      """;
  private final JdbcTemplate jdbc;

  public PostgresSalesDocumentRepositoryAdapter(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  @Override public List<SalesQuote> listQuotes() {
    return jdbc.query(QUOTE_SELECT + " ORDER BY q.created_at DESC", (rs, row) -> quote(rs));
  }

  @Override public Optional<SalesQuote> findQuote(UUID id) {
    return jdbc.query(QUOTE_SELECT + " WHERE q.id = ?", (rs, row) -> quote(rs), id).stream().findFirst();
  }

  @Override public Optional<SalesQuote> findQuoteForUpdate(UUID id) {
    return jdbc.query("SELECT q.*, NULL::uuid AS order_id, NULL::bigint AS order_number FROM sales_quotes q WHERE q.id = ? FOR UPDATE",
        (rs, row) -> quote(rs), id).stream().findFirst();
  }

  @Override public SalesQuote saveQuote(SalesQuote quote) {
    if (findQuote(quote.id()).isEmpty()) {
      jdbc.update("""
          INSERT INTO sales_quotes (id, client_id, client_name, client_document, issue_date, valid_until,
          status, notes, general_discount, freight, subtotal, item_discount, total, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          """, quote.id(), quote.clientId(), quote.clientName(), quote.clientDocument(), quote.issueDate(),
          quote.validUntil(), quote.status().name(), quote.notes(), quote.generalDiscount(), quote.freight(),
          quote.subtotal(), quote.itemDiscount(), quote.total(), "system");
    } else {
      jdbc.update("""
          UPDATE sales_quotes SET client_id=?, client_name=?, client_document=?, issue_date=?, valid_until=?,
          status=?, notes=?, general_discount=?, freight=?, subtotal=?, item_discount=?, total=?, updated_at=now()
          WHERE id=?
          """, quote.clientId(), quote.clientName(), quote.clientDocument(), quote.issueDate(), quote.validUntil(),
          quote.status().name(), quote.notes(), quote.generalDiscount(), quote.freight(), quote.subtotal(),
          quote.itemDiscount(), quote.total(), quote.id());
      jdbc.update("DELETE FROM sales_quote_items WHERE quote_id=?", quote.id());
    }
    quote.items().forEach(item -> insertQuoteItem(quote.id(), item));
    return findQuote(quote.id()).orElseThrow();
  }

  @Override public void updateQuoteStatus(UUID id, String status) {
    jdbc.update("UPDATE sales_quotes SET status=?, updated_at=now() WHERE id=?", status, id);
  }

  @Override public List<SalesOrder> listOrders() {
    return jdbc.query(ORDER_SELECT + " ORDER BY o.created_at DESC", (rs, row) -> order(rs));
  }

  @Override public Optional<SalesOrder> findOrder(UUID id) {
    return jdbc.query(ORDER_SELECT + " WHERE o.id=?", (rs, row) -> order(rs), id).stream().findFirst();
  }

  @Override public Optional<SalesOrder> findOrderByQuote(UUID quoteId) {
    return jdbc.query(ORDER_SELECT + " WHERE o.source_quote_id=?", (rs, row) -> order(rs), quoteId).stream().findFirst();
  }

  @Override public SalesOrder createOrderFromQuote(SalesQuote quote) {
    UUID orderId = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO sales_orders (id, source_quote_id, client_id, client_name, client_document, issue_date,
        status, notes, general_discount, freight, subtotal, item_discount, total, created_by)
        VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 'OPEN', ?, ?, ?, ?, ?, ?, ?)
        """, orderId, quote.id(), quote.clientId(), quote.clientName(), quote.clientDocument(), quote.notes(),
        quote.generalDiscount(), quote.freight(), quote.subtotal(), quote.itemDiscount(), quote.total(), "system");
    quote.items().forEach(item -> jdbc.update("""
        INSERT INTO sales_order_items (id, order_id, product_id, product_code, product_name, unit_of_measure,
        quantity, unit_price, discount, gross_subtotal, net_subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, UUID.randomUUID(), orderId, item.productId(), item.productCode(), item.productName(),
        item.unitOfMeasure(), item.quantity(), item.unitPrice(), item.discount(), item.grossSubtotal(), item.netSubtotal()));
    return findOrder(orderId).orElseThrow();
  }

  @Override public void updateOrderStatus(UUID id, String status) {
    jdbc.update("UPDATE sales_orders SET status=?, updated_at=now() WHERE id=?", status, id);
  }

  private void insertQuoteItem(UUID quoteId, SalesDocumentItem item) {
    jdbc.update("""
        INSERT INTO sales_quote_items (id, quote_id, product_id, product_code, product_name, unit_of_measure,
        quantity, unit_price, discount, gross_subtotal, net_subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, item.id(), quoteId, item.productId(), item.productCode(), item.productName(), item.unitOfMeasure(),
        item.quantity(), item.unitPrice(), item.discount(), item.grossSubtotal(), item.netSubtotal());
  }

  private SalesQuote quote(ResultSet rs) throws SQLException {
    UUID id = rs.getObject("id", UUID.class);
    return new SalesQuote(id, rs.getLong("number"), rs.getObject("client_id", UUID.class),
        rs.getString("client_name"), rs.getString("client_document"), rs.getDate("issue_date").toLocalDate(),
        rs.getDate("valid_until") == null ? null : rs.getDate("valid_until").toLocalDate(),
        SalesQuoteStatus.valueOf(rs.getString("status")), rs.getString("notes"), rs.getBigDecimal("general_discount"),
        rs.getBigDecimal("freight"), rs.getBigDecimal("subtotal"), rs.getBigDecimal("item_discount"),
        rs.getBigDecimal("total"), rs.getObject("order_id", UUID.class), (Long) rs.getObject("order_number"),
        quoteItems(id), rs.getObject("created_at", OffsetDateTime.class), rs.getObject("updated_at", OffsetDateTime.class));
  }

  private SalesOrder order(ResultSet rs) throws SQLException {
    UUID id = rs.getObject("id", UUID.class);
    return new SalesOrder(id, rs.getLong("number"), rs.getObject("source_quote_id", UUID.class),
        rs.getLong("quote_number"), rs.getObject("client_id", UUID.class), rs.getString("client_name"),
        rs.getString("client_document"), rs.getDate("issue_date").toLocalDate(),
        SalesOrderStatus.valueOf(rs.getString("status")), rs.getString("notes"), rs.getBigDecimal("general_discount"),
        rs.getBigDecimal("freight"), rs.getBigDecimal("subtotal"), rs.getBigDecimal("item_discount"),
        rs.getBigDecimal("total"), orderItems(id), rs.getObject("created_at", OffsetDateTime.class),
        rs.getObject("updated_at", OffsetDateTime.class));
  }

  private List<SalesDocumentItem> quoteItems(UUID id) { return items("sales_quote_items", "quote_id", id); }
  private List<SalesDocumentItem> orderItems(UUID id) { return items("sales_order_items", "order_id", id); }
  private List<SalesDocumentItem> items(String table, String foreignKey, UUID id) {
    return jdbc.query("SELECT * FROM " + table + " WHERE " + foreignKey + "=? ORDER BY product_name", (rs, row) ->
        new SalesDocumentItem(rs.getObject("id", UUID.class), rs.getObject("product_id", UUID.class),
            rs.getString("product_code"), rs.getString("product_name"), rs.getString("unit_of_measure"),
            rs.getBigDecimal("quantity"), rs.getBigDecimal("unit_price"), rs.getBigDecimal("discount"),
            rs.getBigDecimal("gross_subtotal"), rs.getBigDecimal("net_subtotal")), id);
  }
}
