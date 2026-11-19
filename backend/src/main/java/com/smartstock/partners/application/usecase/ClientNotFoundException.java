package com.smartstock.partners.application.usecase;

public class ClientNotFoundException extends RuntimeException {

  public ClientNotFoundException() {
    super("Cliente nao encontrado.");
  }
}
