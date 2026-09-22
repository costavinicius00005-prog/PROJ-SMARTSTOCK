package com.smartstock.delivery.infrastructure.web;

import java.util.UUID;

public record DeliveryResponse(
    UUID id,
    UUID orderId,
    UUID clientId,
    String number,
    String clientName,
    String clientPhone,
    String status,
    java.time.OffsetDateTime scheduledDate,
    String city,
    String receiverName,
    String failureReason,
    String fullAddress,
    Long assigneeId,
    String assigneeName,
    String assigneeEmail) {
}
