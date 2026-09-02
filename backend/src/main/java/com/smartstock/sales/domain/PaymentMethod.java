package com.smartstock.sales.domain;
import java.util.UUID;
public record PaymentMethod(UUID id, String code, String name, String kind, boolean allowsChange, boolean allowsCredit) {}
