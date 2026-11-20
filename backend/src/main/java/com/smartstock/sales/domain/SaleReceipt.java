package com.smartstock.sales.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Dados de uma venda exatamente como foram gravados (itens, pagamentos, operador), usados
 * no comprovante e na listagem de vendas do caixa. Nenhum valor e recalculado.
 */
public record SaleReceipt(
    UUID id,
    long number,
    String source,
    UUID salesOrderId,
    Long salesOrderNumber,
    UUID clientId,
    String clientName,
    String clientDocument,
    String operator,
    String status,
    BigDecimal subtotal,
    BigDecimal itemDiscount,
    BigDecimal generalDiscount,
    BigDecimal freight,
    BigDecimal total,
    BigDecimal totalReceived,
    BigDecimal totalChange,
    List<SalesDocumentItem> items,
    List<Payment> payments,
    OffsetDateTime createdAt,
    OffsetDateTime cancelledAt,
    String cancelledBy,
    String cancelReason) {

  public record Payment(
      String methodCode,
      String methodName,
      BigDecimal amount,
      BigDecimal receivedAmount,
      BigDecimal changeAmount,
      int installments) {
  }
}
