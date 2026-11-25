package com.smartstock.sales.application.port;

import com.smartstock.sales.application.usecase.CompleteSaleCommand;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Porta de saida das vendas para o crediario (implementada pelo modulo de contas a receber).
 * Chamada dentro da transacao da venda: se gerar/cancelar o titulo falhar, a venda inteira e desfeita.
 */
public interface CreditSalePort {

  /** Gera o titulo e as parcelas da parte da venda paga no crediario. Idempotente por venda. */
  void registerCreditSale(UUID saleId, UUID clientId, BigDecimal saleTotal, BigDecimal financedAmount,
      CompleteSaleCommand.CreditPlan plan, String operator);

  /** Cancela o crediario da venda (recusa se ja houver recebimentos ativos). Sem crediario: nao faz nada. */
  void cancelCreditSale(UUID saleId, String operator, String reason);
}
