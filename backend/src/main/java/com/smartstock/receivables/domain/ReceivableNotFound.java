package com.smartstock.receivables.domain;

public class ReceivableNotFound extends RuntimeException {

  public ReceivableNotFound(String message) {
    super(message);
  }
}
