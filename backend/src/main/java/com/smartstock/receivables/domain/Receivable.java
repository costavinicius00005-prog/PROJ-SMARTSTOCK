package com.smartstock.receivables.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Titulo do crediario: uma venda financiada para um cliente, dividida em parcelas. */
public record Receivable(
    UUID id,
    long number,
    UUID saleId,
    UUID clientId,
    LocalDate issueDate,
    BigDecimal saleTotal,
    BigDecimal downPayment,
    BigDecimal financedAmount,
    InstallmentPlan plan,
    String status,
    String createdBy) {

  /** Situacao do titulo a partir das parcelas: cancelado se todas canceladas; pago se nao resta saldo. */
  public static String statusFor(List<Installment> installments) {
    boolean allCancelled = installments.stream().allMatch(i -> i.status() == InstallmentStatus.CANCELLED);
    if (allCancelled) {
      return "CANCELLED";
    }
    boolean settled = installments.stream()
        .allMatch(i -> i.status() == InstallmentStatus.PAID || i.status() == InstallmentStatus.CANCELLED);
    return settled ? "PAID" : "OPEN";
  }
}
