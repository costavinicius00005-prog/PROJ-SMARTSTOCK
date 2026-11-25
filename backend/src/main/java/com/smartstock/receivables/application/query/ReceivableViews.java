package com.smartstock.receivables.application.query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Modelos de leitura do crediario (telas, ficha do cliente e relatorios).
 * "situation" e a situacao exibida: OPEN, PARTIAL, PAID, CANCELLED ou OVERDUE (derivada: saldo > 0
 * e vencimento anterior a data de referencia).
 */
public final class ReceivableViews {

  private ReceivableViews() {
  }

  public record InstallmentFilter(String query, UUID clientId, String situation, LocalDate issueFrom,
      LocalDate issueTo, LocalDate dueFrom, LocalDate dueTo, Long saleNumber, Long receivableNumber, int page,
      int size) {
  }

  public record InstallmentRow(UUID installmentId, UUID receivableId, long receivableNumber, int installmentNumber,
      int installmentCount, String titleCode, UUID saleId, long saleNumber, UUID clientId, String clientName,
      String clientDocument, LocalDate issueDate, LocalDate dueDate, LocalDate originalDueDate,
      BigDecimal originalAmount, BigDecimal amount, BigDecimal paidAmount, BigDecimal balance, String status,
      String situation, long daysOverdue, LocalDate paidAt, String notes) {
  }

  public record Page<T>(List<T> items, long total, int page, int size) {
  }

  public record Indicators(BigDecimal totalReceivable, BigDecimal totalReceived, BigDecimal totalOverdue,
      BigDecimal totalOpen, long openInstallments, long overdueInstallments, long delinquentClients,
      LocalDate referenceDate) {
  }

  public record PaymentRow(UUID paymentId, UUID installmentId, UUID receivableId, long receivableNumber,
      int installmentNumber, String titleCode, UUID clientId, String clientName, long saleNumber, BigDecimal amount,
      String methodCode, String methodName, LocalDate paidAt, OffsetDateTime recordedAt, String recordedBy,
      String notes, String status, OffsetDateTime reversedAt, String reversedBy, String reverseReason) {
  }

  public record AuditRow(long id, String action, Integer installmentNumber, BigDecimal oldAmount, BigDecimal newAmount,
      LocalDate oldDueDate, LocalDate newDueDate, String details, String justification, String performedBy,
      OffsetDateTime performedAt) {
  }

  public record ReceivableSummary(UUID receivableId, long number, UUID saleId, long saleNumber, String saleStatus,
      LocalDate issueDate, BigDecimal saleTotal, BigDecimal downPayment, BigDecimal financedAmount,
      BigDecimal currentTotal, BigDecimal paidAmount, BigDecimal balance, int installmentCount, String intervalType,
      Integer intervalDays, String status, String createdBy) {
  }

  public record ClientInfo(UUID id, String name, String document, String phone, String email,
      BigDecimal creditLimit) {
  }

  public record InstallmentDetail(InstallmentRow installment, ReceivableSummary receivable, ClientInfo client,
      List<InstallmentRow> siblings, List<PaymentRow> payments, List<AuditRow> audit) {
  }

  public record ReceivableDetail(ReceivableSummary receivable, ClientInfo client, List<InstallmentRow> installments,
      List<PaymentRow> payments, List<AuditRow> audit) {
  }

  /** Situacao de credito do cliente (usada no caixa antes de vender no crediario). */
  public record CreditStatus(UUID clientId, BigDecimal creditLimit, BigDecimal openBalance, BigDecimal available,
      long overdueInstallments, BigDecimal overdueAmount) {
  }

  /** Evento cronologico da ficha financeira; delta = efeito no saldo devedor. */
  public record TimelineEvent(OffsetDateTime at, String action, String description, Long receivableNumber,
      Integer installmentNumber, BigDecimal delta, BigDecimal balanceAfter, String performedBy) {
  }

  public record ClientStatement(ClientInfo client, BigDecimal totalPurchased, BigDecimal totalPaid, BigDecimal balance,
      BigDecimal availableCredit, long openInstallments, long overdueInstallments, BigDecimal overdueAmount,
      List<InstallmentRow> nextDue, List<ReceivableSummary> purchases, List<PaymentRow> payments,
      List<TimelineEvent> timeline, LocalDate referenceDate) {
  }

  public record DelinquencyRow(UUID clientId, String clientName, String clientDocument, String phone,
      long overdueInstallments, BigDecimal overdueAmount, LocalDate oldestDueDate, long maxDaysOverdue,
      BigDecimal totalBalance) {
  }

  public record MethodTotal(String methodCode, String methodName, long count, BigDecimal total) {
  }

  public record PaymentsReport(LocalDate from, LocalDate to, List<PaymentRow> payments, List<MethodTotal> byMethod,
      BigDecimal total, long count) {
  }

  /**
   * Linha de resumo por periodo. Regime EMISSAO: valores agrupados pela data da venda (titulo).
   * Regime VENCIMENTO: valores de cada parcela agrupados pelo seu vencimento.
   */
  public record PeriodRow(LocalDate periodStart, String label, long titles, long installments, BigDecimal amount,
      BigDecimal received, BigDecimal pending, BigDecimal overdue) {
  }

  public record PeriodReport(String regime, String granularity, LocalDate from, LocalDate to, List<PeriodRow> rows,
      BigDecimal amount, BigDecimal received, BigDecimal pending, BigDecimal overdue) {
  }
}
