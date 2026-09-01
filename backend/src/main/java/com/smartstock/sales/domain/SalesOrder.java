package com.smartstock.sales.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record SalesOrder(UUID id, long number, UUID sourceQuoteId, long sourceQuoteNumber,
    UUID clientId, String clientName, String clientDocument, LocalDate issueDate,
    SalesOrderStatus status, String notes, BigDecimal generalDiscount, BigDecimal freight,
    BigDecimal subtotal, BigDecimal itemDiscount, BigDecimal total, List<SalesDocumentItem> items,
    OffsetDateTime createdAt, OffsetDateTime updatedAt) {
}
