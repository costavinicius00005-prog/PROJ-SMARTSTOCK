package com.smartstock.partners.application.usecase;

public class ClientAlreadyExistsException extends RuntimeException {

  public ClientAlreadyExistsException(String message) {
    super(message);
  }
}
