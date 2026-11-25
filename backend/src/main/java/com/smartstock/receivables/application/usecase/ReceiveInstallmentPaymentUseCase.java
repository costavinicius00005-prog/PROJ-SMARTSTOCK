package com.smartstock.receivables.application.usecase;

import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivableNotFound;
import com.smartstock.receivables.domain.ReceivablePayment;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Baixa (integral ou parcial) de uma parcela. Cada chamada gera um recebimento proprio no historico.
 * requestId torna a operacao idempotente: reenvio/clique duplo devolve a mesma baixa sem duplicar.
 */
@Service
public class ReceiveInstallmentPaymentUseCase {

  public record Command(UUID installmentId, BigDecimal amount, UUID paymentMethodId, LocalDate paidAt, String notes,
      UUID requestId, String operator) {
  }

  public record Result(Installment installment, ReceivablePayment payment, boolean duplicate) {
  }

  private final ReceivableRepositoryPort repository;
  private final Clock clock;

  public ReceiveInstallmentPaymentUseCase(ReceivableRepositoryPort repository, Clock clock) {
    this.repository = repository;
    this.clock = clock;
  }

  @Transactional
  public Result execute(Command command) {
    if (command.requestId() == null) {
      throw new ReceivableRuleViolation("Identificador da operacao nao informado.");
    }
    var previous = repository.findPaymentByRequestId(command.requestId());
    if (previous.isPresent()) {
      return duplicateOf(previous.get(), command);
    }

    Installment installment = repository.findInstallmentForUpdate(command.installmentId())
        .orElseThrow(() -> new ReceivableNotFound("Parcela nao encontrada."));
    // Rechecagem apos o lock: uma requisicao concorrente com o mesmo id pode ter acabado de gravar
    previous = repository.findPaymentByRequestId(command.requestId());
    if (previous.isPresent()) {
      return duplicateOf(previous.get(), command);
    }

    var method = repository.findPaymentMethod(command.paymentMethodId())
        .orElseThrow(() -> new ReceivableRuleViolation("Forma de recebimento invalida."));
    if (!method.active() || method.allowsCredit()) {
      throw new ReceivableRuleViolation("Forma de recebimento invalida para baixa de crediario.");
    }

    Receivable receivable = repository.findById(installment.receivableId())
        .orElseThrow(() -> new ReceivableNotFound("Titulo nao encontrado."));
    LocalDate today = LocalDate.now(clock);
    LocalDate paidAt = command.paidAt() == null ? today : command.paidAt();
    if (paidAt.isAfter(today)) {
      throw new ReceivableRuleViolation("A data do recebimento nao pode ser futura.");
    }
    if (paidAt.isBefore(receivable.issueDate())) {
      throw new ReceivableRuleViolation("A data do recebimento nao pode ser anterior a emissao do titulo.");
    }
    String notes = command.notes() == null || command.notes().isBlank() ? null : command.notes().trim();
    if (notes != null && notes.length() > 500) {
      throw new ReceivableRuleViolation("Observacao muito longa (maximo 500 caracteres).");
    }

    BigDecimal amount = command.amount() == null ? null : command.amount().setScale(2, RoundingMode.HALF_UP);
    Installment updated = installment.receive(amount, paidAt);
    ReceivablePayment payment = new ReceivablePayment(UUID.randomUUID(), installment.id(), amount, method.id(), paidAt,
        notes, command.requestId(), "ACTIVE", command.operator());

    repository.updateInstallment(updated);
    repository.insertPayment(payment);
    repository.audit(new AuditEntry(receivable.id(), installment.id(), payment.id(), "PAYMENT", null, amount, null, null,
        "Recebido R$ " + amount + " (" + method.name() + ") em " + paidAt + ". Saldo da parcela: R$ " + updated.balance(),
        notes, command.operator()));
    repository.updateReceivableStatus(receivable.id(),
        Receivable.statusFor(repository.findInstallmentsForUpdate(receivable.id())));
    return new Result(updated, payment, false);
  }

  private Result duplicateOf(ReceivablePayment payment, Command command) {
    if (!payment.installmentId().equals(command.installmentId())) {
      throw new ReceivableRuleViolation("Identificador de operacao ja utilizado em outra parcela.");
    }
    Installment current = repository.findInstallmentForUpdate(payment.installmentId())
        .orElseThrow(() -> new ReceivableNotFound("Parcela nao encontrada."));
    return new Result(current, payment, true);
  }
}
