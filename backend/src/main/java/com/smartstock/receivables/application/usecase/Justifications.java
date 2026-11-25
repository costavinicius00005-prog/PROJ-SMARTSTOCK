package com.smartstock.receivables.application.usecase;

import com.smartstock.receivables.domain.ReceivableRuleViolation;

/** Alteracoes financeiras exigem justificativa registrada na auditoria. */
final class Justifications {

  private Justifications() {
  }

  static String require(String value) {
    String clean = value == null ? "" : value.trim();
    if (clean.length() < 5) {
      throw new ReceivableRuleViolation("Informe uma justificativa (minimo 5 caracteres).");
    }
    if (clean.length() > 500) {
      throw new ReceivableRuleViolation("Justificativa muito longa (maximo 500 caracteres).");
    }
    return clean;
  }
}
