package com.smartstock.sales.application.usecase;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
/**
 * requestId: identificador gerado pelo caixa para cada tentativa de finalizacao. Reenvios com o
 * mesmo requestId (clique duplo, nova tentativa apos timeout) devolvem a venda ja registrada.
 */
public record CompleteSaleCommand(UUID salesOrderId, UUID clientId, BigDecimal generalDiscount, String notes,
    List<Item> items, List<Payment> payments, UUID requestId) {
  public record Item(UUID productId, BigDecimal quantity, BigDecimal discount) {}
  public record Payment(UUID paymentMethodId, BigDecimal amount, BigDecimal receivedAmount, int installments) {}
}
