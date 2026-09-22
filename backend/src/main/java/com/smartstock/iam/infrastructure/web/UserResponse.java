package com.smartstock.iam.infrastructure.web;

import com.smartstock.iam.domain.User;

public record UserResponse(
    Long id,
    String username,
    String displayName,
    String role,
    boolean active,
    java.time.OffsetDateTime createdAt) {

  public static UserResponse from(User user) {
    return new UserResponse(
        user.id(),
        user.username(),
        user.displayName(),
        user.role(),
        user.active(),
        user.createdAt());
  }
}
