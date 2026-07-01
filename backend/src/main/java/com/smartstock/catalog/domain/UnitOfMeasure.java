package com.smartstock.catalog.domain;

import java.util.UUID;

public record UnitOfMeasure(
    UUID id,
    String acronym,
    String name,
    boolean active,
    boolean systemDefault) {

  public String label() {
    return acronym + " - " + name;
  }
}
