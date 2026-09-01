package com.smartstock.sales.application.usecase;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SaveSalesQuoteCommand(UUID clientId, LocalDate issueDate, LocalDate validUntil,
    String status, String notes, BigDecimal generalDiscount, BigDecimal freight,
    List<Item> items) {
  public record Item(UUID productId, BigDecimal quantity, BigDecimal unitPrice, BigDecimal discount) {}
}
