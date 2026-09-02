package com.smartstock.sales.domain;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
public record Sale(UUID id, long number, String source, UUID salesOrderId, UUID clientId, String clientName,
    BigDecimal subtotal, BigDecimal itemDiscount, BigDecimal generalDiscount, BigDecimal freight,
    BigDecimal total, String status, List<SalesDocumentItem> items, OffsetDateTime createdAt) {}
