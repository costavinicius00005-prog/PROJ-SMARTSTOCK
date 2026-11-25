package com.smartstock.receivables.application.usecase;

import com.smartstock.receivables.application.port.ReceivableRepositoryPort;
import com.smartstock.receivables.domain.AuditEntry;
import com.smartstock.receivables.domain.Installment;
import com.smartstock.receivables.domain.InstallmentStatus;
import com.smartstock.receivables.domain.Receivable;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cancela o crediario quando a venda de origem e cancelada. So e permitido se nenhuma parcela tiver
 * recebimentos ativos (o operador deve estornar antes), para nao perder dinheiro ja recebido.
 */
@Service
public class CancelReceivableForSaleUseCase {

  private final ReceivableRepositoryPort repository;

  public CancelReceivableForSaleUseCase(ReceivableRepositoryPort repository) {
    this.repository = repository;
  }

  @Transactional
  public void execute(UUID saleId, String operator, String reason) {
    Receivable receivable = repository.findBySaleId(saleId).orElse(null);
    if (receivable == null) {
      return;
    }
    List<Installment> installments = repository.findInstallmentsForUpdate(receivable.id());
    BigDecimal paid = installments.stream().map(Installment::paidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    if (paid.signum() > 0) {
      throw new ReceivableRuleViolation("Esta venda possui R$ " + paid + " ja recebidos no crediario (titulo "
          + receivable.number() + "). Estorne os recebimentos antes de cancelar a venda.");
    }
    BigDecimal cancelled = BigDecimal.ZERO;
    for (Installment installment : installments) {
      if (installment.status() != InstallmentStatus.CANCELLED) {
        cancelled = cancelled.add(installment.amount());
        repository.updateInstallment(installment.cancel());
      }
    }
    repository.updateReceivableStatus(receivable.id(), "CANCELLED");
    repository.audit(new AuditEntry(receivable.id(), null, null, "RECEIVABLE_CANCELLED", cancelled, null, null, null,
        "Titulo cancelado pelo cancelamento da venda", reason, operator));
  }
}
