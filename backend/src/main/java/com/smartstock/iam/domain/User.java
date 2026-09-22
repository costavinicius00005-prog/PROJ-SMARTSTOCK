package com.smartstock.iam.domain;

import java.time.OffsetDateTime;

public record User(
    Long id,
    String username,
    String passwordHash,
    String displayName,
    String role,
    boolean active,
    OffsetDateTime createdAt) {
}
