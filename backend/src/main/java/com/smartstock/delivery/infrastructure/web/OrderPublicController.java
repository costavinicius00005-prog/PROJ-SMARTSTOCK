package com.smartstock.delivery.infrastructure.web;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderPublicController {

  private final JdbcTemplate jdbc;

  public OrderPublicController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    List<Map<String, Object>> orders = jdbc.query(
        """
        SELECT o.id, o.number, o.client_id, o.status
        FROM sales_orders o
        ORDER BY o.number DESC
        LIMIT 500
        """,
        (rs, row) -> {
          Map<String, Object> order = new LinkedHashMap<>();
          order.put("id", rs.getObject("id", UUID.class).toString());
          order.put("number", rs.getObject("number", Long.class).toString());
          order.put("clientId", rs.getObject("client_id", UUID.class).toString());
          order.put("status", rs.getString("status"));
          order.put("items", new ArrayList<>());
          return order;
        });

    Map<UUID, Map<String, Object>> byId = new LinkedHashMap<>();
    for (Map<String, Object> order : orders) {
      byId.put(UUID.fromString((String) order.get("id")), order);
    }

    if (!byId.isEmpty()) {
      jdbc.query(
          """
          SELECT order_id, product_id, quantity
          FROM sales_order_items
          ORDER BY order_id
          """,
          (rs, row) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productId", rs.getObject("product_id", UUID.class).toString());
            item.put("quantity", rs.getBigDecimal("quantity"));
            Map<String, Object> order = byId.get(rs.getObject("order_id", UUID.class));
            if (order != null) {
              @SuppressWarnings("unchecked")
              List<Map<String, Object>> items = (List<Map<String, Object>>) order.get("items");
              items.add(item);
            }
            return item;
          });
    }

    return orders;
  }
}
