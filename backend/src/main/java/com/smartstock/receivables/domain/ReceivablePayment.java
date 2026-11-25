package com.smartstock.receivables.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Uma baixa (recebimento) de parcela. Estorno muda o status para REVERSED; nunca e apagada. */
public record ReceivablePayment(
    UUID id,
    UUID installmentId,
    BigDecimal amount,
    UUID paymentMethodId,
    LocalDate paidAt,
    String notes,
    UUID requestId,
    String status,
    String recordedBy) {

  public boolean active() {
    return "ACTIVE".equals(status);
  }
}
