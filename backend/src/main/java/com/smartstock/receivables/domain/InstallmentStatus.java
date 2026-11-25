package com.smartstock.receivables.domain;

/**
 * Situacao gravada da parcela. "Vencido" nao e gravado: e derivado (saldo > 0 e vencimento passado),
 * para nunca ficar desatualizado.
 */
public enum InstallmentStatus {
  OPEN,
  PARTIAL,
  PAID,
  CANCELLED
}
