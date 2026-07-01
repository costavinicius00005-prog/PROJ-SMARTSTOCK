package com.smartstock.catalog.domain;

import java.util.UUID;

public record Brand(
    UUID id,
    String name,
    boolean active,
    boolean systemDefault) {
}
