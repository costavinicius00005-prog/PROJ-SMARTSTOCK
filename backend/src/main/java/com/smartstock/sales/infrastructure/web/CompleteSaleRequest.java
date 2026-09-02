package com.smartstock.sales.infrastructure.web;
import com.smartstock.sales.application.usecase.CompleteSaleCommand;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
public record CompleteSaleRequest(UUID salesOrderId, UUID clientId, BigDecimal generalDiscount, String notes,
    List<Item> items, List<Payment> payments) {
  public CompleteSaleCommand toCommand() { return new CompleteSaleCommand(salesOrderId, clientId, generalDiscount, notes,
      items == null ? List.of() : items.stream().map(i -> new CompleteSaleCommand.Item(i.productId(), i.quantity(), i.discount())).toList(),
      payments == null ? List.of() : payments.stream().map(p -> new CompleteSaleCommand.Payment(p.paymentMethodId(), p.amount(), p.receivedAmount(), p.installments())).toList()); }
  public record Item(UUID productId, BigDecimal quantity, BigDecimal discount) {}
  public record Payment(UUID paymentMethodId, BigDecimal amount, BigDecimal receivedAmount, int installments) {}
}
