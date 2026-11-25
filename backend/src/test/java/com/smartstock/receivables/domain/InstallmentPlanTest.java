package com.smartstock.receivables.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.smartstock.receivables.domain.InstallmentPlan.IntervalType;
import com.smartstock.receivables.domain.InstallmentPlan.ScheduledInstallment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class InstallmentPlanTest {

  private static final LocalDate ISSUE = LocalDate.of(2026, 11, 23);

  @Test void splitsEvenlyLikeTheSpecificationExample() {
    // Venda R$ 1.000, entrada R$ 200 -> R$ 800 em 4x = 4 x R$ 200
    List<ScheduledInstallment> s = new InstallmentPlan(4, IntervalType.MONTHLY, null, LocalDate.of(2026, 12, 23))
        .schedule(new BigDecimal("800.00"), ISSUE);
    assertEquals(4, s.size());
    s.forEach(i -> assertEquals(new BigDecimal("200.00"), i.amount()));
    assertEquals(LocalDate.of(2027, 3, 23), s.get(3).dueDate());
  }

  @Test void distributesRemainingCentsOnFirstInstallmentsAndKeepsExactTotal() {
    List<ScheduledInstallment> s = new InstallmentPlan(3, IntervalType.MONTHLY, null, ISSUE).schedule(new BigDecimal("100.00"), ISSUE);
    assertEquals(new BigDecimal("33.34"), s.get(0).amount());
    assertEquals(new BigDecimal("33.33"), s.get(1).amount());
    assertEquals(new BigDecimal("33.33"), s.get(2).amount());
    assertEquals(new BigDecimal("100.00"), s.stream().map(ScheduledInstallment::amount).reduce(BigDecimal.ZERO, BigDecimal::add));

    List<ScheduledInstallment> seven = new InstallmentPlan(7, IntervalType.MONTHLY, null, ISSUE).schedule(new BigDecimal("1000.01"), ISSUE);
    assertEquals(new BigDecimal("1000.01"), seven.stream().map(ScheduledInstallment::amount).reduce(BigDecimal.ZERO, BigDecimal::add));
    BigDecimal max = seven.stream().map(ScheduledInstallment::amount).max(BigDecimal::compareTo).orElseThrow();
    BigDecimal min = seven.stream().map(ScheduledInstallment::amount).min(BigDecimal::compareTo).orElseThrow();
    assertEquals(new BigDecimal("0.01"), max.subtract(min));
  }

  @Test void monthlyKeepsDayAndAdjustsShortMonths() {
    List<ScheduledInstallment> s = new InstallmentPlan(3, IntervalType.MONTHLY, null, LocalDate.of(2027, 1, 31))
        .schedule(new BigDecimal("90"), LocalDate.of(2027, 1, 10));
    assertEquals(LocalDate.of(2027, 2, 28), s.get(1).dueDate());
    assertEquals(LocalDate.of(2027, 3, 31), s.get(2).dueDate());
  }

  @Test void fixedDayInterval() {
    List<ScheduledInstallment> s = new InstallmentPlan(3, IntervalType.DAYS, 15, ISSUE).schedule(new BigDecimal("30"), ISSUE);
    assertEquals(ISSUE.plusDays(15), s.get(1).dueDate());
    assertEquals(ISSUE.plusDays(30), s.get(2).dueDate());
  }

  @Test void rejectsInconsistentPlans() {
    assertThrows(ReceivableRuleViolation.class, () -> new InstallmentPlan(0, IntervalType.MONTHLY, null, ISSUE));
    assertThrows(ReceivableRuleViolation.class, () -> new InstallmentPlan(61, IntervalType.MONTHLY, null, ISSUE));
    assertThrows(ReceivableRuleViolation.class, () -> new InstallmentPlan(2, IntervalType.DAYS, 0, ISSUE));
    assertThrows(ReceivableRuleViolation.class, () -> new InstallmentPlan(2, IntervalType.MONTHLY, null, null));
    InstallmentPlan plan = new InstallmentPlan(3, IntervalType.MONTHLY, null, ISSUE.minusDays(1));
    assertThrows(ReceivableRuleViolation.class, () -> plan.schedule(BigDecimal.TEN, ISSUE));
    InstallmentPlan ok = new InstallmentPlan(3, IntervalType.MONTHLY, null, ISSUE);
    assertThrows(ReceivableRuleViolation.class, () -> ok.schedule(new BigDecimal("0.02"), ISSUE));
    assertThrows(ReceivableRuleViolation.class, () -> ok.schedule(BigDecimal.ZERO, ISSUE));
  }
}
