package com.smartstock.sales.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record SalesDocumentItem(UUID id, UUID productId, String productCode, String productName,
    String unitOfMeasure, BigDecimal quantity, BigDecimal unitPrice, BigDecimal discount,
    BigDecimal grossSubtotal, BigDecimal netSubtotal) {
}
