package com.smartstock.receivables.infrastructure.persistence;

import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.InstallmentPlan;
import com.smartstock.receivables.domain.InstallmentStatus;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivablePayment;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Persistencia do crediario em JDBC (mesmo padrao do modulo de vendas). Ordem de lock fixa:
 * titulo (receivables) -> parcela, evitando deadlock entre baixas concorrentes do mesmo titulo.
 */
@Repository
public class JdbcReceivableRepositoryAdapter implements ReceivableRepositoryPort {

  private final JdbcTemplate jdbc;

  public JdbcReceivableRepositoryAdapter(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Optional<Receivable> findBySaleId(UUID saleId) {
    return jdbc.query("SELECT * FROM receivables WHERE sale_id = ?", (rs, row) -> receivable(rs), saleId)
        .stream().findFirst();
  }

  @Override
  public Optional<Receivable> findById(UUID receivableId) {
    return jdbc.query("SELECT * FROM receivables WHERE id = ?", (rs, row) -> receivable(rs), receivableId)
        .stream().findFirst();
  }

  @Override
  public Receivable insert(Receivable r, List<Installment> installments) {
    InstallmentPlan plan = r.plan();
    Long number = jdbc.queryForObject("""
        INSERT INTO receivables (id, sale_id, client_id, issue_date, sale_total, down_payment, financed_amount,
          installment_count, interval_type, interval_days, first_due_date, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
        RETURNING number
        """, Long.class, r.id(), r.saleId(), r.clientId(), r.issueDate(), r.saleTotal(), r.downPayment(),
        r.financedAmount(), plan.installments(), plan.intervalType().name(), plan.intervalDays(), plan.firstDueDate(),
        r.createdBy());
    for (Installment i : installments) {
      jdbc.update("""
          INSERT INTO receivable_installments (id, receivable_id, installment_number, due_date, original_due_date,
            original_amount, amount, paid_amount, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'OPEN')
          """, i.id(), r.id(), i.number(), i.dueDate(), i.originalDueDate(), i.originalAmount(), i.amount());
    }
    return findById(r.id()).orElseThrow();
  }

  @Override
  public Optional<Installment> findInstallmentForUpdate(UUID installmentId) {
    List<UUID> owner = jdbc.queryForList(
        "SELECT receivable_id FROM receivable_installments WHERE id = ?", UUID.class, installmentId);
    if (owner.isEmpty()) {
      return Optional.empty();
    }
    lockReceivable(owner.getFirst());
    return jdbc.query("SELECT * FROM receivable_installments WHERE id = ? FOR UPDATE",
        (rs, row) -> installment(rs), installmentId).stream().findFirst();
  }

  @Override
  public List<Installment> findInstallmentsForUpdate(UUID receivableId) {
    lockReceivable(receivableId);
    return jdbc.query("SELECT * FROM receivable_installments WHERE receivable_id = ? ORDER BY installment_number FOR UPDATE",
        (rs, row) -> installment(rs), receivableId);
  }

  private void lockReceivable(UUID receivableId) {
    jdbc.query("SELECT id FROM receivables WHERE id = ? FOR UPDATE", rs -> { }, receivableId);
  }

  @Override
  public void updateInstallment(Installment i) {
    jdbc.update("""
        UPDATE receivable_installments
        SET due_date = ?, amount = ?, paid_amount = ?, status = ?, notes = ?, paid_at = ?,
            cancelled_at = CASE WHEN ? = 'CANCELLED' THEN COALESCE(cancelled_at, now()) ELSE NULL END,
            updated_at = now()
        WHERE id = ?
        """, i.dueDate(), i.amount(), i.paidAmount(), i.status().name(), i.notes(), i.paidAt(), i.status().name(),
        i.id());
  }

  @Override
  public void updateReceivableStatus(UUID receivableId, String status) {
    jdbc.update("UPDATE receivables SET status = ? WHERE id = ?", status, receivableId);
  }

  @Override
  public Optional<ReceivablePayment> findPaymentByRequestId(UUID requestId) {
    return jdbc.query("SELECT * FROM receivable_payments WHERE request_id = ?", (rs, row) -> payment(rs), requestId)
        .stream().findFirst();
  }

  @Override
  public Optional<ReceivablePayment> findPaymentForUpdate(UUID paymentId) {
    return jdbc.query("SELECT * FROM receivable_payments WHERE id = ? FOR UPDATE", (rs, row) -> payment(rs), paymentId)
        .stream().findFirst();
  }

  @Override
  public void insertPayment(ReceivablePayment p) {
    jdbc.update("""
        INSERT INTO receivable_payments (id, installment_id, amount, payment_method_id, paid_at, notes, request_id,
          status, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        """, p.id(), p.installmentId(), p.amount(), p.paymentMethodId(), p.paidAt(), p.notes(), p.requestId(),
        p.recordedBy());
  }

  @Override
  public void markPaymentReversed(UUID paymentId, String reversedBy, String reason) {
    jdbc.update("""
        UPDATE receivable_payments SET status = 'REVERSED', reversed_by = ?, reversed_at = now(), reverse_reason = ?
        WHERE id = ? AND status = 'ACTIVE'
        """, reversedBy, reason, paymentId);
  }

  @Override
  public void audit(AuditEntry e) {
    jdbc.update("""
        INSERT INTO receivable_audit_logs (receivable_id, installment_id, payment_id, action, old_amount, new_amount,
          old_due_date, new_due_date, details, justification, performed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, e.receivableId(), e.installmentId(), e.paymentId(), e.action(), e.oldAmount(), e.newAmount(),
        e.oldDueDate(), e.newDueDate(), truncate(e.details()), truncate(e.justification()), e.performedBy());
  }

  @Override
  public BigDecimal clientOpenBalance(UUID clientId) {
    return jdbc.queryForObject("""
        SELECT COALESCE(sum(i.amount - i.paid_amount), 0)
        FROM receivable_installments i JOIN receivables r ON r.id = i.receivable_id
        WHERE r.client_id = ? AND i.status IN ('OPEN', 'PARTIAL')
        """, BigDecimal.class, clientId);
  }

  @Override
  public boolean isSaleCancelled(UUID saleId) {
    return Boolean.TRUE.equals(jdbc.queryForObject(
        "SELECT EXISTS (SELECT 1 FROM sales WHERE id = ? AND status = 'CANCELLED')", Boolean.class, saleId));
  }

  @Override
  public Optional<PaymentMethodInfo> findPaymentMethod(UUID paymentMethodId) {
    if (paymentMethodId == null) {
      return Optional.empty();
    }
    return jdbc.query("SELECT id, code, name, allows_credit, active FROM payment_methods WHERE id = ?",
        (rs, row) -> new PaymentMethodInfo(rs.getObject("id", UUID.class), rs.getString("code"), rs.getString("name"),
            rs.getBoolean("allows_credit"), rs.getBoolean("active")), paymentMethodId).stream().findFirst();
  }

  private Receivable receivable(ResultSet rs) throws SQLException {
    Integer days = (Integer) rs.getObject("interval_days");
    InstallmentPlan plan = new InstallmentPlan(rs.getInt("installment_count"),
        InstallmentPlan.IntervalType.valueOf(rs.getString("interval_type")), days,
        rs.getObject("first_due_date", LocalDate.class));
    return new Receivable(rs.getObject("id", UUID.class), rs.getLong("number"), rs.getObject("sale_id", UUID.class),
        rs.getObject("client_id", UUID.class), rs.getObject("issue_date", LocalDate.class), rs.getBigDecimal("sale_total"),
        rs.getBigDecimal("down_payment"), rs.getBigDecimal("financed_amount"), plan, rs.getString("status"),
        rs.getString("created_by"));
  }

  private Installment installment(ResultSet rs) throws SQLException {
    return new Installment(rs.getObject("id", UUID.class), rs.getObject("receivable_id", UUID.class),
        rs.getInt("installment_number"), rs.getObject("due_date", LocalDate.class),
        rs.getObject("original_due_date", LocalDate.class), rs.getBigDecimal("original_amount"),
        rs.getBigDecimal("amount"), rs.getBigDecimal("paid_amount"), InstallmentStatus.valueOf(rs.getString("status")),
        rs.getString("notes"), rs.getObject("paid_at", LocalDate.class));
  }

  private ReceivablePayment payment(ResultSet rs) throws SQLException {
    return new ReceivablePayment(rs.getObject("id", UUID.class), rs.getObject("installment_id", UUID.class),
        rs.getBigDecimal("amount"), rs.getObject("payment_method_id", UUID.class),
        rs.getObject("paid_at", LocalDate.class), rs.getString("notes"), rs.getObject("request_id", UUID.class),
        rs.getString("status"), rs.getString("recorded_by"));
  }

  private static String truncate(String value) {
    return value == null || value.length() <= 500 ? value : value.substring(0, 500);
  }
}
