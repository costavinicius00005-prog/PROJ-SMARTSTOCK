package com.smartstock.sales.application.usecase;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
/**
 * requestId: identificador gerado pelo caixa para cada tentativa de finalizacao. Reenvios com o
 * mesmo requestId (clique duplo, nova tentativa apos timeout) devolvem a venda ja registrada.
 * credit: condicoes do crediario, obrigatorias quando um dos pagamentos for a forma "Crediario".
 */
public record CompleteSaleCommand(UUID salesOrderId, UUID clientId, BigDecimal generalDiscount, String notes,
    List<Item> items, List<Payment> payments, UUID requestId, CreditPlan credit) {
  public CompleteSaleCommand(UUID salesOrderId, UUID clientId, BigDecimal generalDiscount, String notes,
      List<Item> items, List<Payment> payments, UUID requestId) {
    this(salesOrderId, clientId, generalDiscount, notes, items, payments, requestId, null);
  }
  public record Item(UUID productId, BigDecimal quantity, BigDecimal discount) {}
  public record Payment(UUID paymentMethodId, BigDecimal amount, BigDecimal receivedAmount, int installments) {}
  /** intervalType: MONTHLY (mesmo dia a cada mes) ou DAYS (a cada intervalDays dias). */
  public record CreditPlan(Integer installments, String intervalType, Integer intervalDays, LocalDate firstDueDate) {}
}
