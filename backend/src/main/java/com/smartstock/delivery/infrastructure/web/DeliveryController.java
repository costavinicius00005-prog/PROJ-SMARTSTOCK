package com.smartstock.delivery.infrastructure.web;

import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class DeliveryController {

  private static final Set<String> VALID_STATUS =
      Set.of("Pendente", "Em rota", "Entregue", "Cancelada");

  private final JdbcTemplate jdbc;

  public DeliveryController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/deliveries")
  public java.util.List<DeliveryResponse> list() {
    return jdbc.query(
        """
        SELECT d.id, d.order_id, d.status, d.scheduled_date, d.city,
               d.receiver_name, d.failure_reason, d.full_address, d.assignee_id,
               u.display_name AS "assigneeName", u.username AS assigneeEmail,
               o.number, o.client_id, c.name AS client_name, c.primary_phone
        FROM deliveries d
        JOIN sales_orders o ON o.id = d.order_id
        JOIN clients c ON c.id = o.client_id
        LEFT JOIN users u ON u.id = d.assignee_id
        ORDER BY CASE d.status WHEN 'Entregue' THEN 1 ELSE 0 END,
                 d.scheduled_date ASC NULLS LAST,
                 o.number ASC
        """,
        (rs, row) -> new DeliveryResponse(
            rs.getObject("id", UUID.class),
            rs.getObject("order_id", UUID.class),
            rs.getObject("client_id", UUID.class),
            rs.getString("number"),
            rs.getString("client_name"),
            rs.getString("primary_phone"),
            rs.getString("status"),
            rs.getObject("scheduled_date", java.time.OffsetDateTime.class),
            rs.getString("city"),
            rs.getString("receiver_name"),
            rs.getString("failure_reason"),
            rs.getString("full_address"),
            rs.getObject("assignee_id", Long.class),
            rs.getString("assigneeName"),
            rs.getString("assigneeEmail")));
  }

  @PostMapping("/deliveries")
  public ResponseEntity<DeliveryResponse> create(@RequestBody DeliveryCreateRequest request) {
    UUID orderId = request.orderId();
    if (orderId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o pedido (orderId).");
    }

    Long orderCount = jdbc.queryForObject(
        "SELECT count(*) FROM sales_orders WHERE id = ?",
        Long.class,
        orderId);
    if (orderCount == null || orderCount == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado.");
    }

    Long existing = jdbc.queryForObject(
        "SELECT count(*) FROM deliveries WHERE order_id = ?",
        Long.class,
        orderId);
    if (existing != null && existing > 0) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Este pedido ja possui uma rota de entrega.");
    }

    UUID deliveryId = UUID.randomUUID();

    // Endereco completo do cliente (rua + numero + bairro + cidade + UF) para o Maps
    var endereco = jdbc.query("""
        SELECT c.address, c.address_number, c.district, c.city, c.state
        FROM sales_orders o JOIN clients c ON c.id = o.client_id
        WHERE o.id = ?
        """,
        (org.springframework.jdbc.core.ResultSetExtractor<java.util.List<String[]>>) rs -> {
          java.util.List<String[]> list = new java.util.ArrayList<>();
          if (rs.next()) {
            list.add(new String[]{
                rs.getString("address"), rs.getString("address_number"),
                rs.getString("district"), rs.getString("city"), rs.getString("state")});
          }
          return list;
        }, orderId);
    String fullAddress = null;
    if (endereco != null && !endereco.isEmpty()) {
      String[] p = endereco.get(0);
      String rua = p[0] == null ? "" : p[0].trim();
      String numero = p[1] == null ? "" : p[1].trim();
      String bairro = p[2] == null ? "" : p[2].trim();
      String cidade = p[3] == null ? "" : p[3].trim();
      String uf = p[4] == null ? "" : p[4].trim();
      java.util.List<String> partes = new java.util.ArrayList<>();
      String ruaComNumero = (rua + (numero.isEmpty() ? "" : ", " + numero)).trim();
      if (!ruaComNumero.isEmpty()) partes.add(ruaComNumero);
      if (!bairro.isEmpty()) partes.add(bairro);
      if (!cidade.isEmpty()) partes.add(cidade);
      if (!uf.isEmpty()) partes.add(uf);
      fullAddress = partes.isEmpty() ? null : String.join(", ", partes);
    }
    // Endereco digitado na tela de rotas tem prioridade sobre o do cliente
    if (request.address() != null && !request.address().trim().isEmpty()) {
      fullAddress = request.address().trim();
    }

    jdbc.update(
        """
        INSERT INTO deliveries (id, order_id, status, scheduled_date, city, full_address)
        VALUES (?, ?, 'Pendente',
                COALESCE(?, now() + interval '1 day'),
                COALESCE(NULLIF(?, ''), (SELECT c.city FROM sales_orders o
                                          JOIN clients c ON c.id = o.client_id
                                          WHERE o.id = ?)),
                ?)
        """,
        deliveryId,
        orderId,
        request.scheduledDate(),
        request.city(),
        orderId,
        fullAddress);

    return ResponseEntity.status(HttpStatus.CREATED).body(findById(deliveryId));
  }

  @PatchMapping("/deliveries/{deliveryId}")
  public DeliveryResponse update(
      @PathVariable UUID deliveryId,
      @RequestBody DeliveryUpdateRequest request) {
    if (request.scheduledDate() == null && request.city() == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Informe ao menos a data agendada ou a cidade.");
    }

    int updated = jdbc.update(
        """
        UPDATE deliveries
        SET scheduled_date = COALESCE(?, scheduled_date),
            city = COALESCE(NULLIF(?, ''), city),
            updated_at = now()
        WHERE id = ?
        """,
        request.scheduledDate(),
        request.city(),
        deliveryId);

    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada.");
    }

    return findById(deliveryId);
  }

  @PutMapping("/deliveries/{deliveryId}/status")
  public ResponseEntity<Void> updateStatus(
      @PathVariable UUID deliveryId,
      @RequestBody DeliveryStatusRequest request) {

    String status = request.status() == null ? "" : request.status().trim();
    if (!VALID_STATUS.contains(status)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Status invalido. Use: Pendente, Em rota, Entregue ou Cancelada.");
    }

    int updated = jdbc.update(
        """
        UPDATE deliveries
        SET status = ?, receiver_name = ?, failure_reason = ?, updated_at = now()
        WHERE id = ?
        """,
        status,
        request.receiverName(),
        request.failureReason(),
        deliveryId);

    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada.");
    }

    return ResponseEntity.ok().build();
  }

  @PutMapping("/deliveries/{deliveryId}/assignee")
  public DeliveryResponse assign(
      @PathVariable UUID deliveryId,
      @RequestBody AssigneeRequest request) {
    String assigneeName = null;
    if (request.assigneeId() != null) {
      assigneeName = jdbc.query("""
          SELECT u.display_name FROM users u
          WHERE u.id = ? AND u.active = TRUE
          """, (org.springframework.jdbc.core.ResultSetExtractor<String>) rs ->
              rs.next() ? rs.getString(1) : null, request.assigneeId());
      if (assigneeName == null) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entregador nao encontrado ou inativo.");
      }
    }
    int updated = jdbc.update(
        "UPDATE deliveries SET assignee_id = ?, assignee_name = ?, updated_at = now() WHERE id = ?",
        request.assigneeId(), assigneeName, deliveryId);
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada.");
    }
    return findById(deliveryId);
  }

  @GetMapping("/deliverers")
  public java.util.List<java.util.Map<String, Object>> deliverers() {
    return jdbc.queryForList("""
        SELECT id, username AS email, display_name AS name
        FROM users WHERE active = TRUE
        ORDER BY display_name ASC
        """);
  }

  public record AssigneeRequest(Long assigneeId) {
  }

  public record LocationRequest(Double latitude, Double longitude, java.time.OffsetDateTime recordedAt) {
  }

  @PostMapping("/deliveries/{deliveryId}/locations")
  public java.util.Map<String, Object> sendLocation(
      @PathVariable UUID deliveryId,
      @RequestBody LocationRequest request) {
    if (request.latitude() == null || request.longitude() == null
        || Math.abs(request.latitude()) > 90 || Math.abs(request.longitude()) > 180) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordenadas invalidas.");
    }
    Integer exists = jdbc.queryForObject(
        "SELECT 1 FROM deliveries WHERE id = ?", Integer.class, deliveryId);
    if (exists == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada.");
    }
    if (request.recordedAt() != null) {
      jdbc.update("""
          INSERT INTO delivery_locations (delivery_id, latitude, longitude, recorded_at)
          VALUES (?, ?, ?, ?)
          """, deliveryId, request.latitude(), request.longitude(), request.recordedAt());
    } else {
      jdbc.update("""
          INSERT INTO delivery_locations (delivery_id, latitude, longitude)
          VALUES (?, ?, ?)
          """, deliveryId, request.latitude(), request.longitude());
    }
    Integer count = jdbc.queryForObject(
        "SELECT count(*) FROM delivery_locations WHERE delivery_id = ?", Integer.class, deliveryId);
    return java.util.Map.of("ok", true, "points", count == null ? 0 : count);
  }

  @GetMapping("/deliveries/live")
  public java.util.List<java.util.Map<String, Object>> live() {
    var pontos = new java.util.HashMap<UUID, java.util.List<java.util.Map<String, Object>>>();
    jdbc.query("""
        SELECT delivery_id, latitude, longitude, recorded_at
        FROM delivery_locations
        ORDER BY recorded_at DESC
        LIMIT 3000
        """, (org.springframework.jdbc.core.ResultSetExtractor<Void>) rs -> {
      while (rs.next()) {
        pontos
            .computeIfAbsent(UUID.fromString(rs.getString("delivery_id")), k -> new java.util.ArrayList<>())
            .add(java.util.Map.of(
                "latitude", rs.getDouble("latitude"),
                "longitude", rs.getDouble("longitude"),
                "recordedAt", rs.getObject("recorded_at", java.time.OffsetDateTime.class).toString()));
      }
      return null;
    });
    return jdbc.query("""
        SELECT d.id, d.status, d.scheduled_date, d.full_address, d.assignee_id,
               u.display_name AS "assigneeName", u.username AS assigneeEmail,
               c.name AS clientName, c.primary_phone AS clientPhone,
               o.number AS orderNumber,
               (SELECT latitude FROM delivery_locations dl
                 WHERE dl.delivery_id = d.id ORDER BY dl.recorded_at DESC LIMIT 1) AS lat,
               (SELECT longitude FROM delivery_locations dl
                 WHERE dl.delivery_id = d.id ORDER BY dl.recorded_at DESC LIMIT 1) AS lng,
               (SELECT recorded_at FROM delivery_locations dl
                 WHERE dl.delivery_id = d.id ORDER BY dl.recorded_at DESC LIMIT 1) AS recordedAt
        FROM deliveries d
        JOIN sales_orders o ON o.id = d.order_id
        JOIN clients c ON c.id = o.client_id
        LEFT JOIN users u ON u.id = d.assignee_id
        ORDER BY d.created_at ASC
        """, (org.springframework.jdbc.core.ResultSetExtractor<java.util.List<java.util.Map<String, Object>>>) rs -> {
      var rows = new java.util.ArrayList<java.util.Map<String, Object>>();
      while (rs.next()) {
        var lat = rs.getObject("lat", Double.class);
        var row = new java.util.HashMap<String, Object>();
        row.put("deliveryId", rs.getString("id"));
        row.put("orderNumber", rs.getString("orderNumber"));
        row.put("status", rs.getString("status"));
        row.put("scheduledDate", rs.getObject("scheduled_date", java.time.OffsetDateTime.class).toString());
        row.put("fullAddress", rs.getString("full_address"));
        row.put("assigneeId", rs.getObject("assignee_id", Long.class));
        row.put("assigneeName", rs.getString("assigneeName"));
        row.put("assigneeEmail", rs.getString("assigneeEmail"));
        row.put("clientName", rs.getString("clientName"));
        row.put("clientPhone", rs.getString("clientPhone"));
        if (lat != null) {
          row.put("latitude", lat);
          row.put("longitude", rs.getObject("lng", Double.class));
          row.put("recordedAt", rs.getObject("recordedAt", java.time.OffsetDateTime.class).toString());
        }
        var historico = pontos.get(UUID.fromString(rs.getString("id")));
        if (historico != null) {
          var caminho = new java.util.ArrayList<>(historico);
          java.util.Collections.reverse(caminho);
          row.put("route", caminho.size() > 300 ? caminho.subList(caminho.size() - 300, caminho.size()) : caminho);
        } else {
          row.put("route", java.util.List.of());
        }
        rows.add(row);
      }
      return rows;
    });
  }

  private DeliveryResponse findById(UUID deliveryId) {
    return jdbc.query(
        """
        SELECT d.id, d.order_id, d.status, d.scheduled_date, d.city,
               d.receiver_name, d.failure_reason, d.full_address, d.assignee_id,
               u.display_name AS "assigneeName", u.username AS assigneeEmail,
               o.number, o.client_id, c.name AS client_name, c.primary_phone
        FROM deliveries d
        JOIN sales_orders o ON o.id = d.order_id
        JOIN clients c ON c.id = o.client_id
        LEFT JOIN users u ON u.id = d.assignee_id
        WHERE d.id = ?
        """,
        (rs, row) -> new DeliveryResponse(
            rs.getObject("id", UUID.class),
            rs.getObject("order_id", UUID.class),
            rs.getObject("client_id", UUID.class),
            rs.getString("number"),
            rs.getString("client_name"),
            rs.getString("primary_phone"),
            rs.getString("status"),
            rs.getObject("scheduled_date", java.time.OffsetDateTime.class),
            rs.getString("city"),
            rs.getString("receiver_name"),
            rs.getString("failure_reason"),
            rs.getString("full_address"),
            rs.getObject("assignee_id", Long.class),
            rs.getString("assigneeName"),
            rs.getString("assigneeEmail")),
        deliveryId).stream().findFirst().orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entrega nao encontrada."));
  }
}
