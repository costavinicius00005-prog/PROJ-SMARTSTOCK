package com.smartstock.delivery.infrastructure.web;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemStatusController {

  private final JdbcTemplate jdbc;

  public SystemStatusController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("service", "smartstock-api");
    body.put("status", "UP");

    Map<String, Object> database = new LinkedHashMap<>();
    try {
      String product = jdbc.queryForObject("SELECT version()", String.class);
      database.put("connected", true);
      database.put("product", "PostgreSQL");
      database.put("version", product == null ? "" : product.split(" on ")[0]);
      database.put("name", jdbc.queryForObject("SELECT current_database()", String.class));
      database.put("host", jdbc.queryForObject("SELECT inet_server_addr()", String.class));

      List<Map<String, Object>> tables = new ArrayList<>();
      for (String table : List.of(
          "products", "clients", "sales_quotes", "sales_orders",
          "deliveries", "users", "roles")) {
        try {
          Long count = jdbc.queryForObject(
              "SELECT count(*) FROM " + table,
              Long.class);
          Map<String, Object> entry = new LinkedHashMap<>();
          entry.put("name", table);
          entry.put("rows", count);
          tables.add(entry);
        } catch (RuntimeException ex) {
          // tabela ainda nao existe nesta instancia: ignora
        }
      }
      database.put("tables", tables);

      Long applied = jdbc.queryForObject(
          "SELECT count(*) FROM flyway_schema_history WHERE success = TRUE",
          Long.class);
      database.put("migrations", applied);

      body.put("status", "UP");
    } catch (RuntimeException ex) {
      database.put("connected", false);
      database.put("error", ex.getMessage());
      body.put("status", "DEGRADED");
    }
    body.put("database", database);

    List<Map<String, Object>> modules = new ArrayList<>();
    modules.add(Map.of("name", "web-erp", "type", "Next.js", "baseUrl", "http://localhost:3000"));
    modules.add(Map.of("name", "api", "type", "Spring Boot", "baseUrl", "http://localhost:8080"));
    modules.add(Map.of("name", "mobile-delivery", "type", "Flutter", "baseUrl", "http://localhost:8080/api"));
    body.put("modules", modules);

    return body;
  }

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("clients", count("clients"));
    out.put("suppliers", count("suppliers"));
    out.put("products", count("products"));
    out.put("lowStockProducts", jdbc.queryForObject(
        "SELECT count(*) FROM products WHERE stock_quantity <= 15", Long.class));
    out.put("openSalesOrders", jdbc.queryForObject(
        "SELECT count(*) FROM sales_orders WHERE status IN ('OPEN', 'CONFIRMED')", Long.class));
    out.put("revenueThisMonth", jdbc.queryForObject("""
        SELECT COALESCE(sum(total), 0)
        FROM sales_orders
        WHERE status IN ('CONFIRMED', 'FULFILLED')
          AND date_trunc('month', issue_date) = date_trunc('month', CURRENT_DATE)
        """, java.math.BigDecimal.class));
    out.put("pendingDeliveries", jdbc.queryForObject(
        "SELECT count(*) FROM deliveries WHERE status IN ('Pendente', 'Em rota')", Long.class));
    out.put("overdueAccounts", jdbc.queryForObject("""
        SELECT count(*) FROM accounts
        WHERE status = 'ABERTO' AND due_date < CURRENT_DATE
        """, Long.class));
    out.put("toPay", jdbc.queryForObject("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'PAGAR' AND status = 'ABERTO'
        """, java.math.BigDecimal.class));
    out.put("toReceive", jdbc.queryForObject("""
        SELECT COALESCE(sum(amount), 0) FROM accounts
        WHERE account_type = 'RECEBER' AND status = 'ABERTO'
        """, java.math.BigDecimal.class));
    return out;
  }

  private Long count(String table) {
    return jdbc.queryForObject("SELECT count(*) FROM " + table, Long.class);
  }
}
