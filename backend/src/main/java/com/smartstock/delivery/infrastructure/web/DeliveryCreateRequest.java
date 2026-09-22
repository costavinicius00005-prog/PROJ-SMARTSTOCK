package com.smartstock.delivery.infrastructure.web;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DeliveryCreateRequest(
    UUID orderId,
    String city,
    OffsetDateTime scheduledDate,
    String address) {
}
