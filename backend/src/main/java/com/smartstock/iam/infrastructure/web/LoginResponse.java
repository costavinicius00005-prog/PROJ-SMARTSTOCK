package com.smartstock.iam.infrastructure.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartstock.iam.domain.User;

public record LoginResponse(
    String token,
    Long id,
    @JsonProperty("email") String email,
    @JsonProperty("userName") String userName,
    String role,
    boolean active) {

  public static LoginResponse from(String token, User user) {
    return new LoginResponse(token, user.id(), user.username(), user.displayName(), user.role(), user.active());
  }
}
