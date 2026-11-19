package com.smartstock.partners.application.usecase;

public class ClientInUseException extends RuntimeException {

  public ClientInUseException(String message) {
    super(message);
  }
}
