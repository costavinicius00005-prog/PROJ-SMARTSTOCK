package com.smartstock.sales.infrastructure.persistence;

import com.smartstock.sales.application.port.SalesDocumentRepositoryPort;
import com.smartstock.sales.domain.SalesDocumentItem;
import com.smartstock.sales.domain.SalesOrder;
import com.smartstock.sales.domain.SalesOrderStatus;
import com.smartstock.sales.domain.SalesQuote;
import com.smartstock.sales.domain.SalesQuoteStatus;
import com.smartstock.sales.domain.PaymentMethod;
import com.smartstock.sales.domain.Sale;
import com.smartstock.sales.application.usecase.CompleteSaleCommand;
import java.math.BigDecimal;
import java.util.Map;
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

  @Override public Optional<SalesOrder> findOrderForUpdate(UUID id) {
    return jdbc.query(ORDER_SELECT + " WHERE o.id=? FOR UPDATE OF o", (rs, row) -> order(rs), id).stream().findFirst();
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

  @Override public List<PaymentMethod> listPaymentMethods() {
    return jdbc.query("SELECT * FROM payment_methods WHERE active=true ORDER BY name", (rs, row) ->
        new PaymentMethod(rs.getObject("id", UUID.class), rs.getString("code"), rs.getString("name"),
            rs.getString("kind"), rs.getBoolean("allows_change"), rs.getBoolean("allows_credit")));
  }

  @Override public Optional<Sale> findSaleByOrder(UUID orderId) {
    return jdbc.query("SELECT * FROM sales WHERE sales_order_id=?", (rs, row) -> sale(rs), orderId).stream().findFirst();
  }

  @Override public Sale saveSale(Sale sale, List<CompleteSaleCommand.Payment> payments,
      Map<UUID, Map<UUID, BigDecimal>> components, Map<UUID, BigDecimal> balances) {
    jdbc.update("""
        INSERT INTO sales(id, source, sales_order_id, client_id, client_name, notes, subtotal, item_discount,
        general_discount, freight, total, status, created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, sale.id(), sale.source(), sale.salesOrderId(), sale.clientId(), sale.clientName(), null,
        sale.subtotal(), sale.itemDiscount(), sale.generalDiscount(), sale.freight(), sale.total(), "COMPLETED", "system");
    for (SalesDocumentItem item : sale.items()) {
      jdbc.update("""
          INSERT INTO sale_items(id,sale_id,product_id,product_code,product_name,unit_of_measure,quantity,
          unit_price,discount,gross_subtotal,net_subtotal) VALUES(?,?,?,?,?,?,?,?,?,?,?)
          """, item.id(), sale.id(), item.productId(), item.productCode(), item.productName(), item.unitOfMeasure(),
          item.quantity(), item.unitPrice(), item.discount(), item.grossSubtotal(), item.netSubtotal());
      components.getOrDefault(item.productId(), Map.of()).forEach((productId, quantity) -> jdbc.update(
          "INSERT INTO sale_item_components(id,sale_item_id,product_id,quantity) VALUES(?,?,?,?)",
          UUID.randomUUID(), item.id(), productId, quantity));
    }
    for (CompleteSaleCommand.Payment payment : payments) {
      BigDecimal received = payment.receivedAmount() == null ? payment.amount() : payment.receivedAmount();
      jdbc.update("INSERT INTO sale_payments(id,sale_id,payment_method_id,amount,received_amount,change_amount,installments) VALUES(?,?,?,?,?,?,?)",
          UUID.randomUUID(), sale.id(), payment.paymentMethodId(), payment.amount(), received,
          received.subtract(payment.amount()).max(BigDecimal.ZERO), Math.max(1, payment.installments()));
    }
    balances.forEach((productId, balance) -> jdbc.update(
        "INSERT INTO stock_movements(id,product_id,sale_id,type,quantity,balance_after,created_by) VALUES(?,?,?,'SALE_OUT',?,?,'system')",
        UUID.randomUUID(), productId, sale.id(), components.values().stream().map(m -> m.getOrDefault(productId, BigDecimal.ZERO)).reduce(BigDecimal.ZERO, BigDecimal::add), balance));
    return jdbc.query("SELECT * FROM sales WHERE id=?", (rs, row) -> sale(rs), sale.id()).getFirst();
  }

  private Sale sale(ResultSet rs) throws SQLException {
    UUID id = rs.getObject("id", UUID.class);
    List<SalesDocumentItem> items = jdbc.query("SELECT * FROM sale_items WHERE sale_id=? ORDER BY product_name", (itemRs, row) ->
        new SalesDocumentItem(itemRs.getObject("id", UUID.class), itemRs.getObject("product_id", UUID.class),
            itemRs.getString("product_code"), itemRs.getString("product_name"), itemRs.getString("unit_of_measure"),
            itemRs.getBigDecimal("quantity"), itemRs.getBigDecimal("unit_price"), itemRs.getBigDecimal("discount"),
            itemRs.getBigDecimal("gross_subtotal"), itemRs.getBigDecimal("net_subtotal")), id);
    return new Sale(id, rs.getLong("number"), rs.getString("source"), rs.getObject("sales_order_id", UUID.class),
        rs.getObject("client_id", UUID.class), rs.getString("client_name"), rs.getBigDecimal("subtotal"),
        rs.getBigDecimal("item_discount"), rs.getBigDecimal("general_discount"), rs.getBigDecimal("freight"),
        rs.getBigDecimal("total"), rs.getString("status"), items, rs.getObject("created_at", OffsetDateTime.class));
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
