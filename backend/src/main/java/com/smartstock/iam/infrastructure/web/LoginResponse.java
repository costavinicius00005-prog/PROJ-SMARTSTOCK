package com.smartstock.iam.infrastructure.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartstock.iam.domain.User;
import java.time.Instant;

public record LoginResponse(
    String token,
    Long id,
    @JsonProperty("email") String email,
    @JsonProperty("userName") String userName,
    String role,
    boolean active,
    Instant expiresAt) {

  public static LoginResponse from(String token, User user, Instant expiresAt) {
    return new LoginResponse(token, user.id(), user.username(), user.displayName(), user.role(), user.active(),
        expiresAt);
  }
}
