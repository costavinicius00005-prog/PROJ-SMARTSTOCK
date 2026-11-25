package com.smartstock.receivables.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class InstallmentTest {

  private static final LocalDate TODAY = LocalDate.of(2026, 11, 23);

  static Installment open(String amount) {
    BigDecimal value = new BigDecimal(amount);
    return new Installment(UUID.randomUUID(), UUID.randomUUID(), 1, TODAY.plusDays(30), TODAY.plusDays(30), value, value,
        new BigDecimal("0.00"), InstallmentStatus.OPEN, null, null);
  }

  @Test void fullPaymentSettlesTheInstallment() {
    Installment paid = open("200.00").receive(new BigDecimal("200"), TODAY);
    assertEquals(InstallmentStatus.PAID, paid.status());
    assertEquals(new BigDecimal("0.00"), paid.balance());
    assertEquals(TODAY, paid.paidAt());
  }

  @Test void partialPaymentKeepsBalanceOpen() {
    Installment partial = open("200.00").receive(new BigDecimal("50"), TODAY);
    assertEquals(InstallmentStatus.PARTIAL, partial.status());
    assertEquals(new BigDecimal("150.00"), partial.balance());
  }

  @Test void multiplePaymentsUntilSettled() {
    // Exemplo da especificacao: 50 + 100 + 50 = 200 -> quitada
    Installment i = open("200.00").receive(new BigDecimal("50"), TODAY);
    i = i.receive(new BigDecimal("100"), TODAY);
    assertEquals(InstallmentStatus.PARTIAL, i.status());
    i = i.receive(new BigDecimal("50"), TODAY);
    assertEquals(InstallmentStatus.PAID, i.status());
    assertEquals(new BigDecimal("200.00"), i.paidAmount());
  }

  @Test void rejectsPaymentAboveBalanceOrOnSettledInstallment() {
    Installment partial = open("200.00").receive(new BigDecimal("150"), TODAY);
    assertThrows(ReceivableRuleViolation.class, () -> partial.receive(new BigDecimal("50.01"), TODAY));
    assertThrows(ReceivableRuleViolation.class, () -> partial.receive(BigDecimal.ZERO, TODAY));
    Installment paid = partial.receive(new BigDecimal("50"), TODAY);
    assertThrows(ReceivableRuleViolation.class, () -> paid.receive(new BigDecimal("0.01"), TODAY));
  }

  @Test void reversalReopensBalance() {
    Installment paid = open("200.00").receive(new BigDecimal("200"), TODAY);
    Installment reopened = paid.reverse(new BigDecimal("200"));
    assertEquals(InstallmentStatus.OPEN, reopened.status());
    assertEquals(new BigDecimal("200.00"), reopened.balance());
    Installment partial = paid.reverse(new BigDecimal("80"));
    assertEquals(InstallmentStatus.PARTIAL, partial.status());
    assertThrows(ReceivableRuleViolation.class, () -> open("10.00").reverse(new BigDecimal("1")));
  }

  @Test void protectsPaidInstallmentsFromEdition() {
    Installment paid = open("200.00").receive(new BigDecimal("200"), TODAY);
    assertThrows(ReceivableRuleViolation.class, () -> paid.changeDueDate(TODAY.plusDays(60), TODAY));
    assertThrows(ReceivableRuleViolation.class, () -> paid.changeAmount(new BigDecimal("150")));
    assertThrows(ReceivableRuleViolation.class, paid::cancel);
    Installment partial = open("200.00").receive(new BigDecimal("10"), TODAY);
    assertThrows(ReceivableRuleViolation.class, () -> partial.changeAmount(new BigDecimal("150")));
    assertThrows(ReceivableRuleViolation.class, partial::cancel);
    // vencimento de parcela parcialmente paga pode ser prorrogado
    assertEquals(TODAY.plusDays(90), partial.changeDueDate(TODAY.plusDays(90), TODAY).dueDate());
  }

  @Test void amountChangePreservesOriginalValue() {
    Installment changed = open("200.00").changeAmount(new BigDecimal("180"));
    assertEquals(new BigDecimal("180.00"), changed.amount());
    assertEquals(new BigDecimal("200.00"), changed.originalAmount());
    assertThrows(ReceivableRuleViolation.class, () -> open("200.00").changeAmount(BigDecimal.ZERO));
  }

  @Test void dueDateChangeValidatesDates() {
    assertThrows(ReceivableRuleViolation.class, () -> open("10").changeDueDate(TODAY.minusDays(1), TODAY));
    Installment i = open("10");
    assertThrows(ReceivableRuleViolation.class, () -> i.changeDueDate(i.dueDate(), TODAY));
    Installment changed = i.changeDueDate(TODAY.plusDays(45), TODAY);
    assertEquals(i.originalDueDate(), changed.originalDueDate());
  }

  @Test void cancelAndReopen() {
    Installment cancelled = open("50").cancel();
    assertEquals(InstallmentStatus.CANCELLED, cancelled.status());
    assertEquals(new BigDecimal("0.00"), cancelled.balance());
    assertThrows(ReceivableRuleViolation.class, cancelled::cancel);
    assertThrows(ReceivableRuleViolation.class, () -> cancelled.receive(BigDecimal.ONE, TODAY));
    assertEquals(InstallmentStatus.OPEN, cancelled.reopen().status());
    assertThrows(ReceivableRuleViolation.class, () -> open("50").reopen());
  }

  @Test void overdueIsDerivedFromDueDateAndBalance() {
    Installment i = open("50");
    assertFalse(i.isOverdue(TODAY));
    assertTrue(i.isOverdue(i.dueDate().plusDays(1)));
    assertEquals(5, i.daysOverdue(i.dueDate().plusDays(5)));
    assertFalse(i.receive(new BigDecimal("50"), TODAY).isOverdue(i.dueDate().plusDays(5)));
  }
}
