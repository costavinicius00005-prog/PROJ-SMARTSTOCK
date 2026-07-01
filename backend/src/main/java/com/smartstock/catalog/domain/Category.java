package com.smartstock.catalog.domain;

import java.util.UUID;

public record Category(
    UUID id,
    String name,
    boolean active,
    boolean systemDefault) {
}
