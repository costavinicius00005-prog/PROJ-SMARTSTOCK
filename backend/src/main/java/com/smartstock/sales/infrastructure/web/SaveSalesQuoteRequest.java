package com.smartstock.sales.infrastructure.web;

import com.smartstock.sales.application.usecase.SaveSalesQuoteCommand;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SaveSalesQuoteRequest(UUID clientId, LocalDate issueDate, LocalDate validUntil,
    String status, String notes, BigDecimal generalDiscount, BigDecimal freight,
    List<Item> items) {
  public record Item(UUID productId, BigDecimal quantity, BigDecimal unitPrice, BigDecimal discount) {}
  public SaveSalesQuoteCommand toCommand() {
    return new SaveSalesQuoteCommand(clientId, issueDate, validUntil, status, notes, generalDiscount, freight,
        items == null ? List.of() : items.stream().map(item -> new SaveSalesQuoteCommand.Item(
            item.productId(), item.quantity(), item.unitPrice(), item.discount())).toList());
  }
}
