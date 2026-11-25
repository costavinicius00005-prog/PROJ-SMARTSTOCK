package com.smartstock.receivables.application.usecase;

import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivableNotFound;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Administracao individual de parcelas: vencimento, valor, observacoes, cancelamento e reabertura.
 * As regras ficam na entidade {@link Installment}; aqui cada alteracao e persistida junto com sua
 * auditoria (valor/vencimento anterior e novo, usuario, data/hora e justificativa).
 */
@Service
public class InstallmentAdministrationUseCase {

  private final ReceivableRepositoryPort repository;

  public InstallmentAdministrationUseCase(ReceivableRepositoryPort repository) {
    this.repository = repository;
  }

  @Transactional
  public Installment changeDueDate(UUID installmentId, LocalDate newDueDate, String justification, String operator) {
    String reason = Justifications.require(justification);
    return apply(installmentId, (ctx) -> {
      Installment updated = ctx.installment().changeDueDate(newDueDate, ctx.receivable().issueDate());
      return new Change(updated, new AuditEntry(ctx.receivable().id(), updated.id(), null, "DUE_DATE_CHANGED", null, null,
          ctx.installment().dueDate(), updated.dueDate(), "Vencimento alterado", reason, operator));
    });
  }

  @Transactional
  public Installment changeAmount(UUID installmentId, BigDecimal newAmount, String justification, String operator) {
    String reason = Justifications.require(justification);
    return apply(installmentId, (ctx) -> {
      Installment updated = ctx.installment().changeAmount(newAmount);
      return new Change(updated, new AuditEntry(ctx.receivable().id(), updated.id(), null, "AMOUNT_CHANGED",
          ctx.installment().amount(), updated.amount(), null, null, "Valor da parcela alterado", reason, operator));
    });
  }

  @Transactional
  public Installment updateNotes(UUID installmentId, String notes, String operator) {
    return apply(installmentId, (ctx) -> {
      Installment updated = ctx.installment().withNotes(notes);
      return new Change(updated, AuditEntry.of(ctx.receivable().id(), updated.id(), "NOTES_CHANGED",
          updated.notes() == null ? "Observacao removida" : "Observacao: " + updated.notes(), null, operator));
    });
  }

  @Transactional
  public Installment cancel(UUID installmentId, String justification, String operator) {
    String reason = Justifications.require(justification);
    return apply(installmentId, (ctx) -> {
      Installment updated = ctx.installment().cancel();
      return new Change(updated, new AuditEntry(ctx.receivable().id(), updated.id(), null, "CANCELLED",
          ctx.installment().amount(), null, null, null, "Parcela cancelada", reason, operator));
    });
  }

  @Transactional
  public Installment reopen(UUID installmentId, String justification, String operator) {
    String reason = Justifications.require(justification);
    return apply(installmentId, (ctx) -> {
      if (repository.isSaleCancelled(ctx.receivable().saleId())) {
        throw new ReceivableRuleViolation("A venda de origem foi cancelada; a parcela nao pode ser reaberta.");
      }
      Installment updated = ctx.installment().reopen();
      return new Change(updated, new AuditEntry(ctx.receivable().id(), updated.id(), null, "REOPENED", null,
          updated.amount(), null, null, "Parcela reaberta", reason, operator));
    });
  }

  private record Context(Receivable receivable, Installment installment) {
  }

  private record Change(Installment installment, AuditEntry audit) {
  }

  private Installment apply(UUID installmentId, Function<Context, Change> operation) {
    Installment installment = repository.findInstallmentForUpdate(installmentId)
        .orElseThrow(() -> new ReceivableNotFound("Parcela nao encontrada."));
    Receivable receivable = repository.findById(installment.receivableId())
        .orElseThrow(() -> new ReceivableNotFound("Titulo nao encontrado."));
    Change change = operation.apply(new Context(receivable, installment));
    repository.updateInstallment(change.installment());
    repository.audit(change.audit());
    repository.updateReceivableStatus(receivable.id(),
        Receivable.statusFor(repository.findInstallmentsForUpdate(receivable.id())));
    return change.installment();
  }
}
