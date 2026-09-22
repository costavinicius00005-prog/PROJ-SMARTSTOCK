package com.smartstock.delivery.infrastructure.web;

public record DeliveryStatusRequest(String status, String receiverName, String failureReason) {
}
