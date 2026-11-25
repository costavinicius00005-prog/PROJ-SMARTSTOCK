package com.smartstock.receivables.infrastructure.persistence;

import com.smartstock.receivables.application.query.ReceivableQueryPort;
import com.smartstock.receivables.application.query.ReceivableViews.AuditRow;
import com.smartstock.receivables.application.query.ReceivableViews.ClientInfo;
import com.smartstock.receivables.application.query.ReceivableViews.ClientStatement;
import com.smartstock.receivables.application.query.ReceivableViews.CreditStatus;
import com.smartstock.receivables.application.query.ReceivableViews.DelinquencyRow;
import com.smartstock.receivables.application.query.ReceivableViews.Indicators;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentDetail;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentFilter;
import com.smartstock.receivables.application.query.ReceivableViews.InstallmentRow;
import com.smartstock.receivables.application.query.ReceivableViews.MethodTotal;
import com.smartstock.receivables.application.query.ReceivableViews.Page;
import com.smartstock.receivables.application.query.ReceivableViews.PaymentRow;
import com.smartstock.receivables.application.query.ReceivableViews.PaymentsReport;
import com.smartstock.receivables.application.query.ReceivableViews.PeriodReport;
import com.smartstock.receivables.application.query.ReceivableViews.PeriodRow;
import com.smartstock.receivables.application.query.ReceivableViews.ReceivableDetail;
import com.smartstock.receivables.application.query.ReceivableViews.ReceivableSummary;
import com.smartstock.receivables.application.query.ReceivableViews.TimelineEvent;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcReceivableQueryAdapter implements ReceivableQueryPort {

  /** Parcela com saldo e vencimento anterior a data de referencia = vencida. */
  private static final String OVERDUE = "(i.status IN ('OPEN','PARTIAL') AND i.due_date < CAST(:today AS date))";

  private static final String INSTALLMENT_SELECT = """
      SELECT i.id AS installment_id, i.receivable_id, r.number AS receivable_number, i.installment_number,
             r.installment_count, r.sale_id, s.number AS sale_number, r.client_id, c.name AS client_name,
             COALESCE(c.cnpj, c.cpf) AS client_document, r.issue_date, i.due_date, i.original_due_date,
             i.original_amount, i.amount, i.paid_amount,
             CASE WHEN i.status = 'CANCELLED' THEN 0 ELSE i.amount - i.paid_amount END AS balance,
             i.status, i.paid_at, i.notes,
             CASE WHEN %1$s THEN 'OVERDUE' ELSE i.status END AS situation,
             CASE WHEN %1$s THEN CAST(:today AS date) - i.due_date ELSE 0 END AS days_overdue
      FROM receivable_installments i
      JOIN receivables r ON r.id = i.receivable_id
      JOIN sales s ON s.id = r.sale_id
      JOIN clients c ON c.id = r.client_id
      """.formatted(OVERDUE);

  private static final String PAYMENT_SELECT = """
      SELECT p.id AS payment_id, p.installment_id, i.receivable_id, r.number AS receivable_number,
             i.installment_number, r.installment_count, r.client_id, c.name AS client_name, s.number AS sale_number,
             p.amount, pm.code AS method_code, pm.name AS method_name, p.paid_at, p.recorded_at, p.recorded_by,
             p.notes, p.status, p.reversed_at, p.reversed_by, p.reverse_reason
      FROM receivable_payments p
      JOIN receivable_installments i ON i.id = p.installment_id
      JOIN receivables r ON r.id = i.receivable_id
      JOIN sales s ON s.id = r.sale_id
      JOIN clients c ON c.id = r.client_id
      JOIN payment_methods pm ON pm.id = p.payment_method_id
      """;

  private static final String SUMMARY_SELECT = """
      SELECT r.*, s.number AS sale_number, s.status AS sale_status,
             (SELECT COALESCE(sum(amount), 0) FROM receivable_installments WHERE receivable_id = r.id AND status <> 'CANCELLED') AS current_total,
             (SELECT COALESCE(sum(paid_amount), 0) FROM receivable_installments WHERE receivable_id = r.id) AS paid_total,
             (SELECT COALESCE(sum(amount - paid_amount), 0) FROM receivable_installments WHERE receivable_id = r.id AND status IN ('OPEN','PARTIAL')) AS balance
      FROM receivables r JOIN sales s ON s.id = r.sale_id
      """;

  private static final String AUDIT_SELECT = """
      SELECT a.*, i.installment_number FROM receivable_audit_logs a
      LEFT JOIN receivable_installments i ON i.id = a.installment_id
      """;

  private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

  private final NamedParameterJdbcTemplate jdbc;

  public JdbcReceivableQueryAdapter(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Page<InstallmentRow> listInstallments(InstallmentFilter f, LocalDate today) {
    MapSqlParameterSource params = new MapSqlParameterSource("today", today);
    StringBuilder where = new StringBuilder(" WHERE 1=1");
    if (f.query() != null) {
      where.append(" AND (c.name ILIKE :q");
      params.addValue("q", "%" + f.query() + "%");
      String digits = f.query().replaceAll("\\D", "");
      if (!digits.isEmpty()) {
        where.append(" OR c.cpf LIKE :digits OR c.cnpj LIKE :digits OR CAST(r.number AS text) = :digitsExact")
            .append(" OR CAST(s.number AS text) = :digitsExact");
        params.addValue("digits", "%" + digits + "%").addValue("digitsExact", digits);
      }
      where.append(")");
    }
    if (f.clientId() != null) {
      where.append(" AND r.client_id = :clientId");
      params.addValue("clientId", f.clientId());
    }
    if (f.situation() != null) {
      where.append(switch (f.situation()) {
        case "OVERDUE" -> " AND " + OVERDUE;
        case "PENDING" -> " AND i.status IN ('OPEN','PARTIAL')";
        case "OPEN", "PARTIAL" -> " AND i.status = '" + f.situation() + "' AND NOT " + OVERDUE;
        default -> " AND i.status = '" + f.situation() + "'";
      });
    }
    range(where, params, "r.issue_date", "issue", f.issueFrom(), f.issueTo());
    range(where, params, "i.due_date", "due", f.dueFrom(), f.dueTo());
    if (f.saleNumber() != null) {
      where.append(" AND s.number = :saleNumber");
      params.addValue("saleNumber", f.saleNumber());
    }
    if (f.receivableNumber() != null) {
      where.append(" AND r.number = :receivableNumber");
      params.addValue("receivableNumber", f.receivableNumber());
    }
    Long total = jdbc.queryForObject("SELECT count(*) FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id"
        + " JOIN sales s ON s.id = r.sale_id JOIN clients c ON c.id = r.client_id" + where, params, Long.class);
    params.addValue("limit", f.size()).addValue("offset", (long) f.page() * f.size());
    List<InstallmentRow> items = jdbc.query(INSTALLMENT_SELECT + where
        + " ORDER BY i.due_date, r.number, i.installment_number LIMIT :limit OFFSET :offset", params,
        (rs, row) -> installmentRow(rs));
    return new Page<>(items, total == null ? 0 : total, f.page(), f.size());
  }

  private static void range(StringBuilder where, MapSqlParameterSource params, String column, String name,
      LocalDate from, LocalDate to) {
    if (from != null) {
      where.append(" AND ").append(column).append(" >= :").append(name).append("From");
      params.addValue(name + "From", from);
    }
    if (to != null) {
      where.append(" AND ").append(column).append(" <= :").append(name).append("To");
      params.addValue(name + "To", to);
    }
  }

  @Override
  public Indicators indicators(LocalDate today) {
    var params = new MapSqlParameterSource("today", today);
    Map<String, Object> row = jdbc.queryForMap("""
        SELECT COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE i.status IN ('OPEN','PARTIAL')), 0) AS total_receivable,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE %1$s), 0) AS total_overdue,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE i.status IN ('OPEN','PARTIAL') AND NOT %1$s), 0) AS total_open,
               count(*) FILTER (WHERE i.status IN ('OPEN','PARTIAL')) AS open_installments,
               count(*) FILTER (WHERE %1$s) AS overdue_installments,
               count(DISTINCT r.client_id) FILTER (WHERE %1$s) AS delinquent_clients
        FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
        """.formatted(OVERDUE), params);
    BigDecimal received = jdbc.queryForObject(
        "SELECT COALESCE(sum(amount), 0) FROM receivable_payments WHERE status = 'ACTIVE'", params, BigDecimal.class);
    return new Indicators((BigDecimal) row.get("total_receivable"), received, (BigDecimal) row.get("total_overdue"),
        (BigDecimal) row.get("total_open"), ((Number) row.get("open_installments")).longValue(),
        ((Number) row.get("overdue_installments")).longValue(), ((Number) row.get("delinquent_clients")).longValue(),
        today);
  }

  @Override
  public Optional<InstallmentDetail> installmentDetail(UUID installmentId, LocalDate today) {
    var params = new MapSqlParameterSource("today", today).addValue("id", installmentId);
    List<InstallmentRow> found = jdbc.query(INSTALLMENT_SELECT + " WHERE i.id = :id", params, (rs, row) -> installmentRow(rs));
    if (found.isEmpty()) {
      return Optional.empty();
    }
    InstallmentRow installment = found.getFirst();
    UUID receivableId = installment.receivableId();
    params.addValue("receivableId", receivableId);
    return Optional.of(new InstallmentDetail(installment,
        summary("r.id = :receivableId", params).getFirst(),
        client(installment.clientId()),
        jdbc.query(INSTALLMENT_SELECT + " WHERE i.receivable_id = :receivableId ORDER BY i.installment_number", params,
            (rs, row) -> installmentRow(rs)),
        jdbc.query(PAYMENT_SELECT + " WHERE p.installment_id = :id ORDER BY p.recorded_at", params,
            (rs, row) -> paymentRow(rs)),
        jdbc.query(AUDIT_SELECT + " WHERE a.installment_id = :id OR (a.receivable_id = :receivableId AND a.installment_id IS NULL)"
            + " ORDER BY a.performed_at, a.id", params, (rs, row) -> auditRow(rs))));
  }

  @Override
  public Optional<ReceivableDetail> receivableBySale(UUID saleId, LocalDate today) {
    var params = new MapSqlParameterSource("today", today).addValue("saleId", saleId);
    List<ReceivableSummary> summaries = summary("r.sale_id = :saleId", params);
    if (summaries.isEmpty()) {
      return Optional.empty();
    }
    ReceivableSummary receivable = summaries.getFirst();
    params.addValue("receivableId", receivable.receivableId());
    UUID clientId = jdbc.queryForObject("SELECT client_id FROM receivables WHERE id = :receivableId", params, UUID.class);
    return Optional.of(new ReceivableDetail(receivable, client(clientId),
        jdbc.query(INSTALLMENT_SELECT + " WHERE i.receivable_id = :receivableId ORDER BY i.installment_number", params,
            (rs, row) -> installmentRow(rs)),
        jdbc.query(PAYMENT_SELECT + " WHERE i.receivable_id = :receivableId ORDER BY p.recorded_at", params,
            (rs, row) -> paymentRow(rs)),
        jdbc.query(AUDIT_SELECT + " WHERE a.receivable_id = :receivableId ORDER BY a.performed_at, a.id", params,
            (rs, row) -> auditRow(rs))));
  }

  @Override
  public Optional<ClientStatement> clientStatement(UUID clientId, LocalDate today) {
    ClientInfo client = client(clientId);
    if (client == null) {
      return Optional.empty();
    }
    var params = new MapSqlParameterSource("today", today).addValue("clientId", clientId);
    Map<String, Object> totals = jdbc.queryForMap("""
        SELECT COALESCE((SELECT sum(financed_amount) FROM receivables WHERE client_id = :clientId AND status <> 'CANCELLED'), 0) AS purchased,
               COALESCE((SELECT sum(p.amount) FROM receivable_payments p JOIN receivable_installments i ON i.id = p.installment_id
                         JOIN receivables r ON r.id = i.receivable_id WHERE r.client_id = :clientId AND p.status = 'ACTIVE'), 0) AS paid,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE i.status IN ('OPEN','PARTIAL')), 0) AS balance,
               count(*) FILTER (WHERE i.status IN ('OPEN','PARTIAL')) AS open_count,
               count(*) FILTER (WHERE %1$s) AS overdue_count,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE %1$s), 0) AS overdue_amount
        FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
        WHERE r.client_id = :clientId
        """.formatted(OVERDUE), params);
    BigDecimal balance = (BigDecimal) totals.get("balance");
    BigDecimal available = client.creditLimit() == null ? null : client.creditLimit().subtract(balance);

    List<AuditRow> audit = jdbc.query(AUDIT_SELECT + " JOIN receivables r ON r.id = a.receivable_id"
        + " WHERE r.client_id = :clientId ORDER BY a.performed_at, a.id", params, (rs, row) -> auditRow(rs));
    Map<Long, Long> receivableNumbers = new java.util.HashMap<>();
    jdbc.query("SELECT a.id, r.number FROM receivable_audit_logs a JOIN receivables r ON r.id = a.receivable_id"
        + " WHERE r.client_id = :clientId", params, rs -> { receivableNumbers.put(rs.getLong(1), rs.getLong(2)); });

    return Optional.of(new ClientStatement(client, (BigDecimal) totals.get("purchased"), (BigDecimal) totals.get("paid"),
        balance, available, ((Number) totals.get("open_count")).longValue(),
        ((Number) totals.get("overdue_count")).longValue(), (BigDecimal) totals.get("overdue_amount"),
        jdbc.query(INSTALLMENT_SELECT + " WHERE r.client_id = :clientId AND i.status IN ('OPEN','PARTIAL')"
            + " ORDER BY i.due_date, r.number, i.installment_number LIMIT 12", params, (rs, row) -> installmentRow(rs)),
        summary("r.client_id = :clientId", params),
        jdbc.query(PAYMENT_SELECT + " WHERE r.client_id = :clientId ORDER BY p.recorded_at DESC", params,
            (rs, row) -> paymentRow(rs)),
        timeline(audit, receivableNumbers), today));
  }

  /** Linha do tempo com o efeito de cada operacao no saldo devedor e o saldo acumulado. */
  private static List<TimelineEvent> timeline(List<AuditRow> audit, Map<Long, Long> receivableNumbers) {
    List<TimelineEvent> events = new ArrayList<>();
    BigDecimal running = BigDecimal.ZERO;
    for (AuditRow a : audit) {
      BigDecimal delta = switch (a.action()) {
        case "CREATED", "PAYMENT_REVERSED", "REOPENED" -> a.newAmount();
        case "PAYMENT" -> a.newAmount().negate();
        case "AMOUNT_CHANGED" -> a.newAmount().subtract(a.oldAmount());
        case "CANCELLED", "RECEIVABLE_CANCELLED" -> a.oldAmount().negate();
        default -> BigDecimal.ZERO;
      };
      running = running.add(delta);
      events.add(new TimelineEvent(a.performedAt(), a.action(), a.details(), receivableNumbers.get(a.id()),
          a.installmentNumber(), delta, running, a.performedBy()));
    }
    Collections.reverse(events);
    return events;
  }

  @Override
  public CreditStatus creditStatus(UUID clientId, LocalDate today) {
    var params = new MapSqlParameterSource("today", today).addValue("clientId", clientId);
    Map<String, Object> row = jdbc.queryForMap("""
        SELECT c.credit_limit,
               COALESCE((SELECT sum(i.amount - i.paid_amount) FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
                         WHERE r.client_id = c.id AND i.status IN ('OPEN','PARTIAL')), 0) AS open_balance,
               (SELECT count(*) FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
                 WHERE r.client_id = c.id AND %1$s) AS overdue_count,
               COALESCE((SELECT sum(i.amount - i.paid_amount) FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
                         WHERE r.client_id = c.id AND %1$s), 0) AS overdue_amount
        FROM clients c WHERE c.id = :clientId
        """.formatted(OVERDUE), params);
    BigDecimal limit = (BigDecimal) row.get("credit_limit");
    BigDecimal open = (BigDecimal) row.get("open_balance");
    return new CreditStatus(clientId, limit, open, limit == null ? null : limit.subtract(open).max(BigDecimal.ZERO),
        ((Number) row.get("overdue_count")).longValue(), (BigDecimal) row.get("overdue_amount"));
  }

  @Override
  public List<DelinquencyRow> delinquency(LocalDate today) {
    var params = new MapSqlParameterSource("today", today);
    return jdbc.query("""
        SELECT c.id, c.name, COALESCE(c.cnpj, c.cpf) AS document, c.primary_phone,
               count(*) FILTER (WHERE %1$s) AS overdue_count,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE %1$s), 0) AS overdue_amount,
               min(i.due_date) FILTER (WHERE %1$s) AS oldest_due,
               COALESCE(sum(i.amount - i.paid_amount), 0) AS total_balance
        FROM receivable_installments i
        JOIN receivables r ON r.id = i.receivable_id
        JOIN clients c ON c.id = r.client_id
        WHERE i.status IN ('OPEN','PARTIAL')
        GROUP BY c.id, c.name, c.cnpj, c.cpf, c.primary_phone
        HAVING count(*) FILTER (WHERE %1$s) > 0
        ORDER BY overdue_amount DESC, c.name
        """.formatted(OVERDUE), params, (rs, row) -> {
          LocalDate oldest = rs.getObject("oldest_due", LocalDate.class);
          return new DelinquencyRow(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("document"),
              rs.getString("primary_phone"), rs.getLong("overdue_count"), rs.getBigDecimal("overdue_amount"), oldest,
              java.time.temporal.ChronoUnit.DAYS.between(oldest, today), rs.getBigDecimal("total_balance"));
        });
  }

  @Override
  public PaymentsReport payments(LocalDate from, LocalDate to) {
    var params = new MapSqlParameterSource("from", from).addValue("to", to);
    List<PaymentRow> rows = jdbc.query(PAYMENT_SELECT + " WHERE p.paid_at BETWEEN :from AND :to ORDER BY p.paid_at, p.recorded_at",
        params, (rs, row) -> paymentRow(rs));
    List<MethodTotal> byMethod = jdbc.query("""
        SELECT pm.code, pm.name, count(*) AS qty, sum(p.amount) AS total
        FROM receivable_payments p JOIN payment_methods pm ON pm.id = p.payment_method_id
        WHERE p.status = 'ACTIVE' AND p.paid_at BETWEEN :from AND :to
        GROUP BY pm.code, pm.name ORDER BY total DESC
        """, params, (rs, row) -> new MethodTotal(rs.getString("code"), rs.getString("name"), rs.getLong("qty"),
        rs.getBigDecimal("total")));
    BigDecimal total = byMethod.stream().map(MethodTotal::total).reduce(BigDecimal.ZERO, BigDecimal::add);
    long count = byMethod.stream().mapToLong(MethodTotal::count).sum();
    return new PaymentsReport(from, to, rows, byMethod, total, count);
  }

  @Override
  public PeriodReport periodSummary(String regime, String granularity, LocalDate from, LocalDate to, LocalDate today) {
    // Valores ja validados por lista fechada (nao vem texto livre do usuario)
    String unit = switch (granularity) { case "DAY" -> "day"; case "WEEK" -> "week"; default -> "month"; };
    String dateColumn = "EMISSAO".equals(regime) ? "r.issue_date" : "i.due_date";
    var params = new MapSqlParameterSource("today", today).addValue("from", from).addValue("to", to);
    List<PeriodRow> rows = jdbc.query("""
        SELECT CAST(date_trunc('%1$s', %2$s) AS date) AS period,
               count(DISTINCT r.id) AS titles, count(i.id) AS installments,
               sum(i.amount) AS amount, sum(i.paid_amount) AS received,
               sum(i.amount - i.paid_amount) AS pending,
               COALESCE(sum(i.amount - i.paid_amount) FILTER (WHERE %3$s), 0) AS overdue
        FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
        WHERE i.status <> 'CANCELLED' AND %2$s BETWEEN :from AND :to
        GROUP BY 1 ORDER BY 1
        """.formatted(unit, dateColumn, OVERDUE), params, (rs, row) -> {
          LocalDate period = rs.getObject("period", LocalDate.class);
          return new PeriodRow(period, label(period, granularity), rs.getLong("titles"), rs.getLong("installments"),
              rs.getBigDecimal("amount"), rs.getBigDecimal("received"), rs.getBigDecimal("pending"),
              rs.getBigDecimal("overdue"));
        });
    return new PeriodReport(regime, granularity, from, to, rows,
        sum(rows, PeriodRow::amount), sum(rows, PeriodRow::received), sum(rows, PeriodRow::pending),
        sum(rows, PeriodRow::overdue));
  }

  private static BigDecimal sum(List<PeriodRow> rows, java.util.function.Function<PeriodRow, BigDecimal> field) {
    return rows.stream().map(field).reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private static String label(LocalDate period, String granularity) {
    return switch (granularity) {
      case "DAY" -> period.format(BR);
      case "WEEK" -> "Semana de " + period.format(BR);
      default -> period.format(DateTimeFormatter.ofPattern("MM/yyyy"));
    };
  }

  private List<ReceivableSummary> summary(String condition, MapSqlParameterSource params) {
    return jdbc.query(SUMMARY_SELECT + " WHERE " + condition + " ORDER BY r.issue_date DESC, r.number DESC", params,
        (rs, row) -> new ReceivableSummary(rs.getObject("id", UUID.class), rs.getLong("number"),
            rs.getObject("sale_id", UUID.class), rs.getLong("sale_number"), rs.getString("sale_status"),
            rs.getObject("issue_date", LocalDate.class), rs.getBigDecimal("sale_total"),
            rs.getBigDecimal("down_payment"), rs.getBigDecimal("financed_amount"), rs.getBigDecimal("current_total"),
            rs.getBigDecimal("paid_total"), rs.getBigDecimal("balance"), rs.getInt("installment_count"),
            rs.getString("interval_type"), (Integer) rs.getObject("interval_days"), rs.getString("status"),
            rs.getString("created_by")));
  }

  private ClientInfo client(UUID clientId) {
    return jdbc.query("SELECT id, name, COALESCE(cnpj, cpf) AS document, primary_phone, email, credit_limit"
        + " FROM clients WHERE id = :id", new MapSqlParameterSource("id", clientId),
        (rs, row) -> new ClientInfo(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("document"),
            rs.getString("primary_phone"), rs.getString("email"), rs.getBigDecimal("credit_limit")))
        .stream().findFirst().orElse(null);
  }

  private static InstallmentRow installmentRow(ResultSet rs) throws SQLException {
    long number = rs.getLong("receivable_number");
    int installment = rs.getInt("installment_number");
    int count = rs.getInt("installment_count");
    return new InstallmentRow(rs.getObject("installment_id", UUID.class), rs.getObject("receivable_id", UUID.class),
        number, installment, count, number + "-" + installment + "/" + count, rs.getObject("sale_id", UUID.class),
        rs.getLong("sale_number"), rs.getObject("client_id", UUID.class), rs.getString("client_name"),
        rs.getString("client_document"), rs.getObject("issue_date", LocalDate.class),
        rs.getObject("due_date", LocalDate.class), rs.getObject("original_due_date", LocalDate.class),
        rs.getBigDecimal("original_amount"), rs.getBigDecimal("amount"), rs.getBigDecimal("paid_amount"),
        rs.getBigDecimal("balance"), rs.getString("status"), rs.getString("situation"), rs.getLong("days_overdue"),
        rs.getObject("paid_at", LocalDate.class), rs.getString("notes"));
  }

  private static PaymentRow paymentRow(ResultSet rs) throws SQLException {
    long number = rs.getLong("receivable_number");
    int installment = rs.getInt("installment_number");
    return new PaymentRow(rs.getObject("payment_id", UUID.class), rs.getObject("installment_id", UUID.class),
        rs.getObject("receivable_id", UUID.class), number, installment,
        number + "-" + installment + "/" + rs.getInt("installment_count"), rs.getObject("client_id", UUID.class),
        rs.getString("client_name"), rs.getLong("sale_number"), rs.getBigDecimal("amount"), rs.getString("method_code"),
        rs.getString("method_name"), rs.getObject("paid_at", LocalDate.class),
        rs.getObject("recorded_at", OffsetDateTime.class), rs.getString("recorded_by"), rs.getString("notes"),
        rs.getString("status"), rs.getObject("reversed_at", OffsetDateTime.class), rs.getString("reversed_by"),
        rs.getString("reverse_reason"));
  }

  private static AuditRow auditRow(ResultSet rs) throws SQLException {
    return new AuditRow(rs.getLong("id"), rs.getString("action"), (Integer) rs.getObject("installment_number"),
        rs.getBigDecimal("old_amount"), rs.getBigDecimal("new_amount"), rs.getObject("old_due_date", LocalDate.class),
        rs.getObject("new_due_date", LocalDate.class), rs.getString("details"), rs.getString("justification"),
        rs.getString("performed_by"), rs.getObject("performed_at", OffsetDateTime.class));
  }
}
