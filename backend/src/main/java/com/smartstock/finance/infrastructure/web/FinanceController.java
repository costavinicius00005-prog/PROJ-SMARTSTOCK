package com.smartstock.finance.infrastructure.web;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

  private static final Set<String> TYPES = Set.of("PAGAR", "RECEBER");
  private static final Set<String> STATUSES = Set.of("ABERTO", "PAGO", "CANCELADO");

  private final JdbcTemplate jdbc;

  public FinanceController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public record AccountCreateRequest(
      String type, String description, String partyName,
      java.math.BigDecimal amount, LocalDate dueDate, String status) {
  }

  public record AccountUpdateRequest(String status, String description, LocalDate dueDate) {
  }

  @GetMapping("/accounts")
  public java.util.List<java.util.Map<String, Object>> list(
      @RequestParam(required = false) String type) {
    if (type != null && !TYPES.contains(type)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo invalido. Use PAGAR ou RECEBER.");
    }
    String sql = """
        SELECT id, account_type AS type, description, party_name AS "partyName",
               amount, due_date AS "dueDate", status,
               (status = 'ABERTO' AND due_date < CURRENT_DATE) AS overdue
        FROM accounts
        """ + (type != null ? "WHERE account_type = ? " : "") + """
        ORDER BY due_date ASC, created_at DESC
        """;
    return type != null ? jdbc.queryForList(sql, type) : jdbc.queryForList(sql);
  }

  @GetMapping("/summary")
  public java.util.Map<String, Object> summary() {
    var out = new java.util.LinkedHashMap<String, Object>();
    out.put("toPay", totals("PAGAR"));
    out.put("toReceive", totals("RECEBER"));
    out.put("overdue", jdbc.queryForMap("""
        SELECT count(*)::bigint AS count,
               COALESCE(sum(amount), 0) AS total
        FROM accounts
        WHERE status = 'ABERTO' AND due_date < CURRENT_DATE
        """));
    out.put("paidThisMonth", jdbc.queryForMap("""
        SELECT count(*)::bigint AS count,
               COALESCE(sum(amount), 0) AS total
        FROM accounts
        WHERE status = 'PAGO' AND date_trunc('month', updated_at) = date_trunc('month', now())
        """));
    return out;
  }

  private java.util.Map<String, Object> totals(String type) {
    return jdbc.queryForMap("""
        SELECT count(*)::bigint AS count,
               COALESCE(sum(amount), 0) AS total
        FROM accounts
        WHERE account_type = ? AND status = 'ABERTO'
        """, type);
  }

  @PostMapping("/accounts")
  public ResponseEntity<java.util.Map<String, Object>> create(
      @RequestBody AccountCreateRequest request) {
    if (request.type() == null || !TYPES.contains(request.type())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o tipo: PAGAR ou RECEBER.");
    }
    String description = request.description() == null ? "" : request.description().trim();
    if (description.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a descricao da conta.");
    }
    if (request.amount() == null || request.amount().signum() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor maior que zero.");
    }
    if (request.dueDate() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data de vencimento.");
    }
    String status = request.status() == null || request.status().isBlank()
        ? "ABERTO" : request.status();
    if (!STATUSES.contains(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido.");
    }

    UUID id = UUID.randomUUID();
    jdbc.update("""
        INSERT INTO accounts (id, account_type, description, party_name, amount, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, id, request.type(), description, request.partyName(),
        request.amount(), request.dueDate(), status);

    return ResponseEntity.status(HttpStatus.CREATED).body(findById(id));
  }

  @PatchMapping("/accounts/{accountId}")
  public java.util.Map<String, Object> update(
      @PathVariable UUID accountId,
      @RequestBody AccountUpdateRequest request) {
    if (request.status() != null && !STATUSES.contains(request.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido.");
    }
    int updated = jdbc.update("""
        UPDATE accounts
        SET status = COALESCE(?, status),
            description = COALESCE(NULLIF(?, ''), description),
            due_date = COALESCE(?, due_date),
            updated_at = now()
        WHERE id = ?
        """, request.status(), request.description(), request.dueDate(), accountId);
    if (updated == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta nao encontrada.");
    }
    return findById(accountId);
  }

  private java.util.Map<String, Object> findById(UUID id) {
    return jdbc.queryForMap("""
        SELECT id, account_type AS type, description, party_name AS "partyName",
               amount, due_date AS "dueDate", status,
               (status = 'ABERTO' AND due_date < CURRENT_DATE) AS overdue
        FROM accounts WHERE id = ?
        """, id);
  }
}
