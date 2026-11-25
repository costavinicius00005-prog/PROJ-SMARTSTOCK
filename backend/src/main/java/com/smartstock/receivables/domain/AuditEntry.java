package com.smartstock.receivables.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Registro de auditoria de uma operacao financeira do crediario (somente insercao). */
public record AuditEntry(
    UUID receivableId,
    UUID installmentId,
    UUID paymentId,
    String action,
    BigDecimal oldAmount,
    BigDecimal newAmount,
    LocalDate oldDueDate,
    LocalDate newDueDate,
    String details,
    String justification,
    String performedBy) {

  public static AuditEntry of(UUID receivableId, UUID installmentId, String action, String details,
      String justification, String performedBy) {
    return new AuditEntry(receivableId, installmentId, null, action, null, null, null, null, details, justification,
        performedBy);
  }
}
