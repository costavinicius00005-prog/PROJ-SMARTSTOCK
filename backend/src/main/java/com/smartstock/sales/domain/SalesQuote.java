package com.smartstock.sales.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record SalesQuote(UUID id, long number, UUID clientId, String clientName, String clientDocument,
    LocalDate issueDate, LocalDate validUntil, SalesQuoteStatus status, String notes,
    BigDecimal generalDiscount, BigDecimal freight, BigDecimal subtotal, BigDecimal itemDiscount,
    BigDecimal total, UUID salesOrderId, Long salesOrderNumber, List<SalesDocumentItem> items,
    OffsetDateTime createdAt, OffsetDateTime updatedAt) {
  public boolean editable() { return status == SalesQuoteStatus.DRAFT || status == SalesQuoteStatus.OPEN; }
  public boolean convertible() { return status == SalesQuoteStatus.OPEN && salesOrderId == null; }
}
