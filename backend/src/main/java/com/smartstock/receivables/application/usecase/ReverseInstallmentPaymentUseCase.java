package com.smartstock.receivables.application.usecase;

import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivableNotFound;
import com.smartstock.receivables.domain.ReceivablePayment;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Estorno de um recebimento (reabre o saldo da parcela). O recebimento nao e apagado: fica com
 * status REVERSED, com usuario, data e justificativa, e a operacao e auditada.
 */
@Service
public class ReverseInstallmentPaymentUseCase {

  private final ReceivableRepositoryPort repository;

  public ReverseInstallmentPaymentUseCase(ReceivableRepositoryPort repository) {
    this.repository = repository;
  }

  @Transactional
  public Installment execute(UUID paymentId, String justification, String operator) {
    String reason = Justifications.require(justification);
    ReceivablePayment snapshot = repository.findPaymentForUpdate(paymentId)
        .orElseThrow(() -> new ReceivableNotFound("Recebimento nao encontrado."));
    // Ordem de lock padrao (titulo -> parcela) para evitar deadlock com baixas concorrentes
    Installment installment = repository.findInstallmentForUpdate(snapshot.installmentId())
        .orElseThrow(() -> new ReceivableNotFound("Parcela nao encontrada."));
    ReceivablePayment payment = repository.findPaymentForUpdate(paymentId).orElseThrow();
    if (!payment.active()) {
      throw new ReceivableRuleViolation("Este recebimento ja foi estornado.");
    }

    Installment updated = installment.reverse(payment.amount());
    repository.updateInstallment(updated);
    repository.markPaymentReversed(payment.id(), operator, reason);
    repository.audit(new AuditEntry(installment.receivableId(), installment.id(), payment.id(), "PAYMENT_REVERSED", null,
        payment.amount(), null, null, "Estorno de R$ " + payment.amount() + " recebido em " + payment.paidAt()
            + ". Saldo da parcela: R$ " + updated.balance(), reason, operator));
    repository.updateReceivableStatus(installment.receivableId(),
        Receivable.statusFor(repository.findInstallmentsForUpdate(installment.receivableId())));
    return updated;
  }
}
