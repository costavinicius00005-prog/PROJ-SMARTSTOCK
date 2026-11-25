package com.smartstock.receivables.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Parcela de um titulo do crediario. Imutavel: cada operacao devolve uma nova parcela ja validada,
 * e o caso de uso persiste o resultado junto com o registro de auditoria.
 */
public record Installment(
    UUID id,
    UUID receivableId,
    int number,
    LocalDate dueDate,
    LocalDate originalDueDate,
    BigDecimal originalAmount,
    BigDecimal amount,
    BigDecimal paidAmount,
    InstallmentStatus status,
    String notes,
    LocalDate paidAt) {

  public BigDecimal balance() {
    return status == InstallmentStatus.CANCELLED ? BigDecimal.ZERO.setScale(2) : amount.subtract(paidAmount);
  }

  public boolean isOverdue(LocalDate today) {
    return (status == InstallmentStatus.OPEN || status == InstallmentStatus.PARTIAL) && dueDate.isBefore(today);
  }

  public long daysOverdue(LocalDate today) {
    return isOverdue(today) ? java.time.temporal.ChronoUnit.DAYS.between(dueDate, today) : 0;
  }

  /** Registra um recebimento (integral ou parcial). Nunca aceita valor acima do saldo. */
  public Installment receive(BigDecimal value, LocalDate paymentDate) {
    requireReceivable();
    BigDecimal money = money(value);
    if (money.signum() <= 0) {
      throw new ReceivableRuleViolation("Informe um valor recebido maior que zero.");
    }
    if (money.compareTo(balance()) > 0) {
      throw new ReceivableRuleViolation("Valor recebido (" + money + ") maior que o saldo pendente da parcela (" + balance() + ").");
    }
    BigDecimal newPaid = paidAmount.add(money);
    InstallmentStatus newStatus = newPaid.compareTo(amount) == 0 ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL;
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, amount, newPaid,
        newStatus, notes, newStatus == InstallmentStatus.PAID ? paymentDate : null);
  }

  /** Estorna um recebimento: a parcela volta a ter saldo (reabertura auditada de parcela paga). */
  public Installment reverse(BigDecimal value) {
    if (status == InstallmentStatus.CANCELLED) {
      throw new ReceivableRuleViolation("Parcela cancelada nao possui recebimentos ativos.");
    }
    BigDecimal newPaid = paidAmount.subtract(money(value));
    if (newPaid.signum() < 0) {
      throw new ReceivableRuleViolation("Estorno maior que o valor pago da parcela.");
    }
    InstallmentStatus newStatus = newPaid.signum() == 0 ? InstallmentStatus.OPEN : InstallmentStatus.PARTIAL;
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, amount, newPaid,
        newStatus, notes, null);
  }

  /** Altera o vencimento. Permitido enquanto houver saldo (em aberto ou parcialmente paga). */
  public Installment changeDueDate(LocalDate newDueDate, LocalDate issueDate) {
    requireReceivable();
    if (newDueDate == null) {
      throw new ReceivableRuleViolation("Informe o novo vencimento.");
    }
    if (newDueDate.isBefore(issueDate)) {
      throw new ReceivableRuleViolation("O vencimento nao pode ser anterior a emissao do titulo.");
    }
    if (newDueDate.equals(dueDate)) {
      throw new ReceivableRuleViolation("O novo vencimento e igual ao atual.");
    }
    return new Installment(id, receivableId, number, newDueDate, originalDueDate, originalAmount, amount, paidAmount,
        status, notes, paidAt);
  }

  /**
   * Altera o valor (renegociacao/abatimento). So permitido em parcela sem nenhum recebimento,
   * para nao comprometer o historico financeiro. O valor original fica preservado.
   */
  public Installment changeAmount(BigDecimal newAmount) {
    if (status != InstallmentStatus.OPEN || paidAmount.signum() != 0) {
      throw new ReceivableRuleViolation("O valor so pode ser alterado em parcela em aberto e sem recebimentos.");
    }
    BigDecimal money = money(newAmount);
    if (money.signum() <= 0) {
      throw new ReceivableRuleViolation("O valor da parcela deve ser maior que zero.");
    }
    if (money.compareTo(amount) == 0) {
      throw new ReceivableRuleViolation("O novo valor e igual ao atual.");
    }
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, money, paidAmount,
        status, notes, paidAt);
  }

  public Installment withNotes(String newNotes) {
    String clean = newNotes == null || newNotes.isBlank() ? null : newNotes.trim();
    if (clean != null && clean.length() > 500) {
      throw new ReceivableRuleViolation("Observacao muito longa (maximo 500 caracteres).");
    }
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, amount, paidAmount,
        status, clean, paidAt);
  }

  /** Cancela a parcela. Nao e permitido com recebimentos ativos (estorne-os antes). */
  public Installment cancel() {
    if (status == InstallmentStatus.CANCELLED) {
      throw new ReceivableRuleViolation("A parcela ja esta cancelada.");
    }
    if (paidAmount.signum() != 0) {
      throw new ReceivableRuleViolation("Parcela com recebimentos nao pode ser cancelada. Estorne os recebimentos antes.");
    }
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, amount, paidAmount,
        InstallmentStatus.CANCELLED, notes, null);
  }

  /** Reabre uma parcela cancelada (operacao autorizada e auditada). */
  public Installment reopen() {
    if (status != InstallmentStatus.CANCELLED) {
      throw new ReceivableRuleViolation("Somente parcelas canceladas podem ser reabertas. Para reabrir uma parcela paga, estorne o recebimento.");
    }
    return new Installment(id, receivableId, number, dueDate, originalDueDate, originalAmount, amount, paidAmount,
        InstallmentStatus.OPEN, notes, null);
  }

  private void requireReceivable() {
    if (status == InstallmentStatus.CANCELLED) {
      throw new ReceivableRuleViolation("Parcela cancelada.");
    }
    if (status == InstallmentStatus.PAID) {
      throw new ReceivableRuleViolation("Parcela ja quitada.");
    }
  }

  private static BigDecimal money(BigDecimal value) {
    if (value == null) {
      throw new ReceivableRuleViolation("Informe o valor.");
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }
}
