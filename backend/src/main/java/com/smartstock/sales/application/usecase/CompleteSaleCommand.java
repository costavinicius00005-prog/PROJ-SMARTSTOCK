package com.smartstock.sales.application.usecase;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
public record CompleteSaleCommand(UUID salesOrderId, UUID clientId, BigDecimal generalDiscount, String notes,
    List<Item> items, List<Payment> payments) {
  public record Item(UUID productId, BigDecimal quantity, BigDecimal discount) {}
  public record Payment(UUID paymentMethodId, BigDecimal amount, BigDecimal receivedAmount, int installments) {}
}
