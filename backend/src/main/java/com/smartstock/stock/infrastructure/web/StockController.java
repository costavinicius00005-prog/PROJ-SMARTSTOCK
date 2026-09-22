package com.smartstock.stock.infrastructure.web;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stock")
public class StockController {

  private static final Set<String> TYPES = Set.of("ENTRADA", "SAIDA", "AJUSTE");

  private final JdbcTemplate jdbc;

  public StockController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public record LocationCreateRequest(String name, String description) {
  }

  public record MovementCreateRequest(
      UUID productId, UUID locationId, String type, BigDecimal quantity, String note) {
  }

  @GetMapping("/locations")
  public List<Map<String, Object>> locations() {
    return jdbc.queryForList("""
        SELECT id, name, description, active,
               (SELECT count(*) FROM stock_movements m WHERE m.location_id = l.id) AS "movementCount"
        FROM stock_locations l
        ORDER BY name ASC
        """);
  }

  @PostMapping("/locations")
  public ResponseEntity<Map<String, Object>> createLocation(@RequestBody LocationCreateRequest request) {
    String name = request.name() == null ? "" : request.name().trim();
    if (name.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do local.");
    }
    UUID id = UUID.randomUUID();
    try {
      jdbc.update(
          "INSERT INTO stock_locations (id, name, description) VALUES (?, ?, ?)",
          id, name, request.description());
    } catch (org.springframework.dao.DataIntegrityViolationException ex) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um local com esse nome.");
    }
    return ResponseEntity.status(HttpStatus.CREATED).body(findLocation(id));
  }

  @DeleteMapping("/locations/{locationId}")
  public ResponseEntity<Void> deleteLocation(@PathVariable UUID locationId) {
    Long used = jdbc.queryForObject(
        "SELECT count(*) FROM stock_movements WHERE location_id = ?", Long.class, locationId);
    if (used != null && used > 0) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Local possui movimentacoes e nao pode ser excluido.");
    }
    int removed = jdbc.update("DELETE FROM stock_locations WHERE id = ?", locationId);
    if (removed == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Local nao encontrado.");
    }
    return ResponseEntity.noContent().build();
  }

  private Map<String, Object> findLocation(UUID id) {
    return jdbc.queryForMap("""
        SELECT id, name, description, active,
               (SELECT count(*) FROM stock_movements m WHERE m.location_id = l.id) AS "movementCount"
        FROM stock_locations l WHERE id = ?
        """, id);
  }

  @GetMapping("/movements")
  public List<Map<String, Object>> movements() {
    return jdbc.queryForList("""
        SELECT m.id, m.product_id AS "productId", p.name AS "productName",
               p.internal_code AS "productCode",
               m.location_id AS "locationId", l.name AS "locationName",
               m.movement_type AS type, m.quantity, m.note, m.created_at AS "createdAt"
        FROM stock_movements m
        JOIN products p ON p.id = m.product_id
        LEFT JOIN stock_locations l ON l.id = m.location_id
        ORDER BY m.created_at DESC
        LIMIT 300
        """);
  }

  @PostMapping("/movements")
  @Transactional
  public ResponseEntity<Map<String, Object>> createMovement(@RequestBody MovementCreateRequest request) {
    if (request.productId() == null || request.type() == null || request.quantity() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Informe produto, tipo (ENTRADA/SAIDA/AJUSTE) e quantidade.");
    }
    String type = request.type().trim().toUpperCase();
    if (!TYPES.contains(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de movimentacao invalido.");
    }
    BigDecimal qty = request.quantity();
    if (qty.signum() == 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade nao pode ser zero.");
    }
    if (!"AJUSTE".equals(type) && qty.signum() < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade deve ser positiva.");
    }

    BigDecimal current = jdbc.queryForObject(
        "SELECT stock_quantity FROM products WHERE id = ?", BigDecimal.class, request.productId());
    if (current == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado.");
    }

    BigDecimal next = switch (type) {
      case "ENTRADA" -> current.add(qty);
      case "SAIDA" -> current.subtract(qty);
      default -> current.add(qty); // AJUSTE: quantidade pode ser negativa ou positiva
    };
    if (next.signum() < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Estoque insuficiente. Saldo atual: " + current.toPlainString());
    }

    UUID movementId = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO stock_movements (id, product_id, location_id, movement_type, quantity, note)
        VALUES (?, ?, ?, ?, ?, ?)
        """, movementId, request.productId(), request.locationId(), type, qty, request.note());
    jdbc.update("UPDATE products SET stock_quantity = ?, updated_at = now() WHERE id = ?",
        next, request.productId());

    return ResponseEntity.status(HttpStatus.CREATED).body(findMovement(movementId));
  }

  private Map<String, Object> findMovement(UUID id) {
    return jdbc.queryForMap("""
        SELECT m.id, m.product_id AS "productId", p.name AS "productName",
               p.internal_code AS "productCode",
               m.location_id AS "locationId", l.name AS "locationName",
               m.movement_type AS type, m.quantity, m.note, m.created_at AS "createdAt"
        FROM stock_movements m
        JOIN products p ON p.id = m.product_id
        LEFT JOIN stock_locations l ON l.id = m.location_id
        WHERE m.id = ?
        """, id);
  }

  @GetMapping("/summary")
  public Map<String, Object> summary() {
    return Map.of(
        "productCount", jdbc.queryForObject("SELECT count(*) FROM products", Long.class),
        "totalUnits", jdbc.queryForObject(
            "SELECT COALESCE(sum(stock_quantity), 0) FROM products", BigDecimal.class),
        "lowStockCount", jdbc.queryForObject(
            "SELECT count(*) FROM products WHERE stock_quantity <= 15", Long.class),
        "movementCount", jdbc.queryForObject("SELECT count(*) FROM stock_movements", Long.class),
        "locationCount", jdbc.queryForObject("SELECT count(*) FROM stock_locations", Long.class));
  }
}
