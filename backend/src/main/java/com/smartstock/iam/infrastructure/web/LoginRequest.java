package com.smartstock.iam.infrastructure.web;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginRequest(String username, String email, String password) {

  public String identifier() {
    return username != null ? username : email;
  }
}
