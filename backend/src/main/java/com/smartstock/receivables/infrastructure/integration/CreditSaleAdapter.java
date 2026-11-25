package com.smartstock.receivables.infrastructure.integration;

import com.smartstock.receivables.application.usecase.CancelReceivableForSaleUseCase;
import com.smartstock.receivables.application.usecase.IssueCreditReceivableUseCase;
import com.smartstock.receivables.domain.InstallmentPlan;
import com.smartstock.receivables.domain.ReceivableRuleViolation;
import com.smartstock.sales.application.port.CreditSalePort;
import com.smartstock.sales.application.usecase.CompleteSaleCommand;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Liga o caixa (modulo de vendas) ao crediario, traduzindo o plano da venda para o dominio. */
@Component
public class CreditSaleAdapter implements CreditSalePort {

  private final IssueCreditReceivableUseCase issue;
  private final CancelReceivableForSaleUseCase cancel;

  public CreditSaleAdapter(IssueCreditReceivableUseCase issue, CancelReceivableForSaleUseCase cancel) {
    this.issue = issue;
    this.cancel = cancel;
  }

  @Override
  public void registerCreditSale(UUID saleId, UUID clientId, BigDecimal saleTotal, BigDecimal financedAmount,
      CompleteSaleCommand.CreditPlan plan, String operator) {
    if (plan == null || plan.installments() == null) {
      throw new ReceivableRuleViolation("Informe as condicoes do crediario (parcelas e vencimentos).");
    }
    InstallmentPlan.IntervalType type;
    try {
      type = InstallmentPlan.IntervalType.valueOf(plan.intervalType() == null ? "MONTHLY" : plan.intervalType());
    } catch (IllegalArgumentException ex) {
      throw new ReceivableRuleViolation("Intervalo entre parcelas invalido.");
    }
    issue.execute(new IssueCreditReceivableUseCase.Command(saleId, clientId, saleTotal, financedAmount,
        new InstallmentPlan(plan.installments(), type, plan.intervalDays(), plan.firstDueDate()), operator));
  }

  @Override
  public void cancelCreditSale(UUID saleId, String operator, String reason) {
    cancel.execute(saleId, operator, reason);
  }
}
