package com.smartstock.receivables.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Plano de parcelamento escolhido no caixa: quantidade, intervalo (mensal ou a cada N dias) e
 * primeiro vencimento. Calcula as parcelas em centavos: o valor financiado e dividido igualmente e
 * os centavos que sobram vao para as primeiras parcelas (diferenca maxima de R$ 0,01 entre parcelas
 * e soma sempre exatamente igual ao financiado).
 */
public record InstallmentPlan(int installments, IntervalType intervalType, Integer intervalDays, LocalDate firstDueDate) {

  public static final int MAX_INSTALLMENTS = 60;

  public enum IntervalType { MONTHLY, DAYS }

  public record ScheduledInstallment(int number, LocalDate dueDate, BigDecimal amount) {
  }

  public InstallmentPlan {
    if (installments < 1 || installments > MAX_INSTALLMENTS) {
      throw new ReceivableRuleViolation("A quantidade de parcelas deve ser entre 1 e " + MAX_INSTALLMENTS + ".");
    }
    if (intervalType == null) {
      throw new ReceivableRuleViolation("Informe o intervalo entre as parcelas.");
    }
    if (intervalType == IntervalType.DAYS && (intervalDays == null || intervalDays < 1 || intervalDays > 365)) {
      throw new ReceivableRuleViolation("O intervalo em dias deve ser entre 1 e 365.");
    }
    if (intervalType == IntervalType.MONTHLY) {
      intervalDays = null;
    }
    if (firstDueDate == null) {
      throw new ReceivableRuleViolation("Informe a data do primeiro vencimento.");
    }
  }

  public List<ScheduledInstallment> schedule(BigDecimal financedAmount, LocalDate issueDate) {
    if (financedAmount == null || financedAmount.signum() <= 0) {
      throw new ReceivableRuleViolation("O valor do crediario deve ser maior que zero.");
    }
    if (firstDueDate.isBefore(issueDate)) {
      throw new ReceivableRuleViolation("O primeiro vencimento nao pode ser anterior a data da venda.");
    }
    long totalCents = financedAmount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
    if (totalCents < installments) {
      throw new ReceivableRuleViolation("Valor insuficiente para " + installments + " parcelas (minimo R$ 0,01 por parcela).");
    }
    long base = totalCents / installments;
    long remainder = totalCents % installments;
    List<ScheduledInstallment> result = new ArrayList<>(installments);
    for (int i = 0; i < installments; i++) {
      long cents = base + (i < remainder ? 1 : 0);
      result.add(new ScheduledInstallment(i + 1, dueDate(i), BigDecimal.valueOf(cents, 2)));
    }
    return result;
  }

  /** Vencimento da parcela de indice i (0 = primeira). Mensal preserva o dia (ajustando fim de mes). */
  public LocalDate dueDate(int index) {
    return intervalType == IntervalType.MONTHLY
        ? firstDueDate.plusMonths(index)
        : firstDueDate.plusDays((long) intervalDays * index);
  }
}
