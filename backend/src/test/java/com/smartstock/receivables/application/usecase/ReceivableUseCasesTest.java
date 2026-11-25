package com.smartstock.receivables.application.usecase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.application.port.ReceivableRepositoryPort.PaymentMethodInfo;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.InstallmentPlan;
import com.smartstock.receivables.domain.InstallmentStatus;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivablePayment;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReceivableUseCasesTest {

  static final LocalDate TODAY = LocalDate.of(2026, 11, 23);
  final Clock clock = Clock.fixed(TODAY.atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant(), ZoneId.of("America/Sao_Paulo"));

  @Mock ReceivableRepositoryPort repository;
  @Mock ClientRepositoryPort clients;

  UUID clientId = UUID.randomUUID(), saleId = UUID.randomUUID(), receivableId = UUID.randomUUID();
  UUID pix = UUID.randomUUID(), crediario = UUID.randomUUID();

  IssueCreditReceivableUseCase issue;
  ReceiveInstallmentPaymentUseCase receive;
  ReverseInstallmentPaymentUseCase reverse;
  InstallmentAdministrationUseCase admin;
  CancelReceivableForSaleUseCase cancelForSale;

  @BeforeEach void setUp() {
    issue = new IssueCreditReceivableUseCase(repository, clients, clock);
    receive = new ReceiveInstallmentPaymentUseCase(repository, clock);
    reverse = new ReverseInstallmentPaymentUseCase(repository);
    admin = new InstallmentAdministrationUseCase(repository);
    cancelForSale = new CancelReceivableForSaleUseCase(repository);
  }

  // ---------- geracao do crediario ----------

  @Test void issuesInstallmentsWithAuditAndDownPayment() {
    when(repository.findBySaleId(saleId)).thenReturn(Optional.empty());
    when(clients.findById(clientId)).thenReturn(Optional.of(client(null)));
    when(repository.insert(any(), any())).thenAnswer(inv -> inv.getArgument(0));
    var plan = new InstallmentPlan(4, InstallmentPlan.IntervalType.MONTHLY, null, TODAY.plusMonths(1));

    Receivable r = issue.execute(new IssueCreditReceivableUseCase.Command(saleId, clientId, new BigDecimal("1000"),
        new BigDecimal("800"), plan, "operador"));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Installment>> installments = ArgumentCaptor.forClass(List.class);
    verify(repository).insert(any(), installments.capture());
    assertEquals(4, installments.getValue().size());
    installments.getValue().forEach(i -> assertEquals(new BigDecimal("200.00"), i.amount()));
    assertEquals(new BigDecimal("200.00"), r.downPayment());
    assertEquals(TODAY, r.issueDate());
    ArgumentCaptor<AuditEntry> audit = ArgumentCaptor.forClass(AuditEntry.class);
    verify(repository).audit(audit.capture());
    assertEquals("CREATED", audit.getValue().action());
    assertEquals("operador", audit.getValue().performedBy());
  }

  @Test void issueIsIdempotentPerSale() {
    Receivable existing = receivable();
    when(repository.findBySaleId(saleId)).thenReturn(Optional.of(existing));
    Receivable r = issue.execute(new IssueCreditReceivableUseCase.Command(saleId, clientId, BigDecimal.TEN, BigDecimal.TEN,
        new InstallmentPlan(1, InstallmentPlan.IntervalType.MONTHLY, null, TODAY), "op"));
    assertEquals(existing.id(), r.id());
    verify(repository, never()).insert(any(), any());
  }

  @Test void creditRequiresClientAndRespectsCreditLimit() {
    when(repository.findBySaleId(saleId)).thenReturn(Optional.empty());
    var plan = new InstallmentPlan(2, InstallmentPlan.IntervalType.MONTHLY, null, TODAY.plusMonths(1));
    assertThrows(ReceivableRuleViolation.class, () -> issue.execute(new IssueCreditReceivableUseCase.Command(saleId, null,
        BigDecimal.TEN, BigDecimal.TEN, plan, "op")));

    when(clients.findById(clientId)).thenReturn(Optional.of(client(new BigDecimal("500"))));
    when(repository.clientOpenBalance(clientId)).thenReturn(new BigDecimal("400"));
    var ex = assertThrows(ReceivableRuleViolation.class, () -> issue.execute(new IssueCreditReceivableUseCase.Command(saleId,
        clientId, new BigDecimal("150"), new BigDecimal("150"), plan, "op")));
    assertTrue(ex.getMessage().contains("Limite de credito excedido"));
    verify(repository, never()).insert(any(), any());
  }

  // ---------- baixas ----------

  @Test void paymentRecordsIndividualHistoryAndUpdatesStatus() {
    Installment installment = installment("200.00", "0.00", InstallmentStatus.OPEN);
    stubForPayment(installment);
    var result = receive.execute(new ReceiveInstallmentPaymentUseCase.Command(installment.id(), new BigDecimal("50"), pix,
        TODAY, "pagou no balcao", UUID.randomUUID(), "operador"));
    assertEquals(InstallmentStatus.PARTIAL, result.installment().status());
    verify(repository).insertPayment(any());
    ArgumentCaptor<AuditEntry> audit = ArgumentCaptor.forClass(AuditEntry.class);
    verify(repository).audit(audit.capture());
    assertEquals("PAYMENT", audit.getValue().action());
    assertEquals(new BigDecimal("50.00"), audit.getValue().newAmount());
    verify(repository).updateReceivableStatus(receivableId, "OPEN");
  }

  @Test void duplicatedRequestDoesNotCreateSecondPayment() {
    Installment installment = installment("200.00", "50.00", InstallmentStatus.PARTIAL);
    UUID requestId = UUID.randomUUID();
    when(repository.findPaymentByRequestId(requestId)).thenReturn(Optional.of(new ReceivablePayment(UUID.randomUUID(),
        installment.id(), new BigDecimal("50.00"), pix, TODAY, null, requestId, "ACTIVE", "op")));
    when(repository.findInstallmentForUpdate(installment.id())).thenReturn(Optional.of(installment));

    var result = receive.execute(new ReceiveInstallmentPaymentUseCase.Command(installment.id(), new BigDecimal("50"), pix,
        TODAY, null, requestId, "op"));

    assertTrue(result.duplicate());
    verify(repository, never()).insertPayment(any());
    verify(repository, never()).updateInstallment(any());
  }

  @Test void rejectsPaymentAboveBalanceFutureDateAndCreditMethod() {
    Installment installment = installment("200.00", "150.00", InstallmentStatus.PARTIAL);
    stubForPayment(installment);
    assertThrows(ReceivableRuleViolation.class, () -> receive.execute(new ReceiveInstallmentPaymentUseCase.Command(
        installment.id(), new BigDecimal("60"), pix, TODAY, null, UUID.randomUUID(), "op")));
    assertThrows(ReceivableRuleViolation.class, () -> receive.execute(new ReceiveInstallmentPaymentUseCase.Command(
        installment.id(), new BigDecimal("10"), pix, TODAY.plusDays(1), null, UUID.randomUUID(), "op")));
    assertThrows(ReceivableRuleViolation.class, () -> receive.execute(new ReceiveInstallmentPaymentUseCase.Command(
        installment.id(), new BigDecimal("10"), crediario, TODAY, null, UUID.randomUUID(), "op")));
    verify(repository, never()).insertPayment(any());
  }

  @Test void reversalKeepsPaymentAndAudits() {
    Installment paid = installment("200.00", "200.00", InstallmentStatus.PAID);
    UUID paymentId = UUID.randomUUID();
    ReceivablePayment payment = new ReceivablePayment(paymentId, paid.id(), new BigDecimal("200.00"), pix, TODAY, null,
        UUID.randomUUID(), "ACTIVE", "op");
    when(repository.findPaymentForUpdate(paymentId)).thenReturn(Optional.of(payment));
    when(repository.findInstallmentForUpdate(paid.id())).thenReturn(Optional.of(paid));
    when(repository.findInstallmentsForUpdate(receivableId)).thenReturn(List.of(paid.reverse(new BigDecimal("200"))));

    Installment result = reverse.execute(paymentId, "Cheque devolvido", "gerente");

    assertEquals(InstallmentStatus.OPEN, result.status());
    verify(repository).markPaymentReversed(paymentId, "gerente", "Cheque devolvido");
    assertThrows(ReceivableRuleViolation.class, () -> reverse.execute(paymentId, "", "gerente"));
  }

  // ---------- administracao das parcelas ----------

  @Test void dueDateAndAmountChangesAreAuditedWithOldAndNewValues() {
    Installment installment = installment("200.00", "0.00", InstallmentStatus.OPEN);
    when(repository.findInstallmentForUpdate(installment.id())).thenReturn(Optional.of(installment));
    when(repository.findById(receivableId)).thenReturn(Optional.of(receivable()));
    when(repository.findInstallmentsForUpdate(receivableId)).thenReturn(List.of(installment));

    admin.changeDueDate(installment.id(), installment.dueDate().plusDays(10), "Cliente pediu prorrogacao", "gerente");
    admin.changeAmount(installment.id(), new BigDecimal("180"), "Desconto negociado", "gerente");

    ArgumentCaptor<AuditEntry> audit = ArgumentCaptor.forClass(AuditEntry.class);
    verify(repository, org.mockito.Mockito.times(2)).audit(audit.capture());
    AuditEntry due = audit.getAllValues().get(0), amount = audit.getAllValues().get(1);
    assertEquals("DUE_DATE_CHANGED", due.action());
    assertEquals(installment.dueDate(), due.oldDueDate());
    assertEquals(installment.dueDate().plusDays(10), due.newDueDate());
    assertEquals("Cliente pediu prorrogacao", due.justification());
    assertEquals("AMOUNT_CHANGED", amount.action());
    assertEquals(new BigDecimal("200.00"), amount.oldAmount());
    assertEquals(new BigDecimal("180.00"), amount.newAmount());
    assertEquals("gerente", amount.performedBy());
  }

  @Test void changesRequireJustificationAndProtectPaidInstallments() {
    Installment paid = installment("200.00", "200.00", InstallmentStatus.PAID);
    assertThrows(ReceivableRuleViolation.class, () -> admin.cancel(paid.id(), "x", "gerente"));
    when(repository.findInstallmentForUpdate(paid.id())).thenReturn(Optional.of(paid));
    when(repository.findById(receivableId)).thenReturn(Optional.of(receivable()));
    assertThrows(ReceivableRuleViolation.class, () -> admin.cancel(paid.id(), "Cliente desistiu", "gerente"));
    assertThrows(ReceivableRuleViolation.class, () -> admin.changeAmount(paid.id(), BigDecimal.ONE, "Ajuste manual", "gerente"));
    verify(repository, never()).updateInstallment(any());
  }

  @Test void reopenIsBlockedWhenSaleWasCancelled() {
    Installment cancelled = installment("200.00", "0.00", InstallmentStatus.CANCELLED);
    when(repository.findInstallmentForUpdate(cancelled.id())).thenReturn(Optional.of(cancelled));
    when(repository.findById(receivableId)).thenReturn(Optional.of(receivable()));
    when(repository.isSaleCancelled(saleId)).thenReturn(true);
    assertThrows(ReceivableRuleViolation.class, () -> admin.reopen(cancelled.id(), "Reabrir por engano", "gerente"));
  }

  @Test void saleCancellationIsRefusedWhenThereArePayments() {
    when(repository.findBySaleId(saleId)).thenReturn(Optional.of(receivable()));
    when(repository.findInstallmentsForUpdate(receivableId)).thenReturn(List.of(
        installment("100.00", "30.00", InstallmentStatus.PARTIAL), installment("100.00", "0.00", InstallmentStatus.OPEN)));
    assertThrows(ReceivableRuleViolation.class, () -> cancelForSale.execute(saleId, "op", null));
    verify(repository, never()).updateInstallment(any());
  }

  @Test void saleCancellationCancelsAllOpenInstallments() {
    when(repository.findBySaleId(saleId)).thenReturn(Optional.of(receivable()));
    when(repository.findInstallmentsForUpdate(receivableId)).thenReturn(List.of(
        installment("100.00", "0.00", InstallmentStatus.OPEN), installment("100.00", "0.00", InstallmentStatus.OPEN)));
    cancelForSale.execute(saleId, "op", "Devolucao");
    verify(repository, org.mockito.Mockito.times(2)).updateInstallment(any());
    verify(repository).updateReceivableStatus(receivableId, "CANCELLED");
  }

  // ---------- auxiliares ----------

  private void stubForPayment(Installment installment) {
    when(repository.findPaymentByRequestId(any())).thenReturn(Optional.empty());
    when(repository.findInstallmentForUpdate(installment.id())).thenReturn(Optional.of(installment));
    org.mockito.Mockito.lenient().when(repository.findPaymentMethod(pix))
        .thenReturn(Optional.of(new PaymentMethodInfo(pix, "PIX", "PIX", false, true)));
    org.mockito.Mockito.lenient().when(repository.findPaymentMethod(crediario))
        .thenReturn(Optional.of(new PaymentMethodInfo(crediario, "CREDIARIO", "Crediario", true, true)));
    org.mockito.Mockito.lenient().when(repository.findById(receivableId)).thenReturn(Optional.of(receivable()));
    org.mockito.Mockito.lenient().when(repository.findInstallmentsForUpdate(receivableId)).thenReturn(List.of(installment));
  }

  private Installment installment(String amount, String paid, InstallmentStatus status) {
    return new Installment(UUID.randomUUID(), receivableId, 1, TODAY.plusDays(30), TODAY.plusDays(30),
        new BigDecimal(amount), new BigDecimal(amount), new BigDecimal(paid), status, null, null);
  }

  private Receivable receivable() {
    return new Receivable(receivableId, 7, saleId, clientId, TODAY.minusDays(10), new BigDecimal("1000"),
        new BigDecimal("200"), new BigDecimal("800"),
        new InstallmentPlan(4, InstallmentPlan.IntervalType.MONTHLY, null, TODAY), "OPEN", "op");
  }

  private Client client(BigDecimal creditLimit) {
    return new Client(clientId, "Pessoa fisica", "123", null, "Cliente", null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, creditLimit);
  }
}
