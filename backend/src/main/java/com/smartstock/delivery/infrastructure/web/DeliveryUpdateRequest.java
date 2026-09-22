package com.smartstock.delivery.infrastructure.web;

import java.time.OffsetDateTime;

public record DeliveryUpdateRequest(
    String city,
    OffsetDateTime scheduledDate) {
}
