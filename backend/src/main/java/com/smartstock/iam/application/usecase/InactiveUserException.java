package com.smartstock.iam.application.usecase;

public class InactiveUserException extends RuntimeException {

  public InactiveUserException() {
    super("Usuario inativo. Contate o administrador.");
  }
}
