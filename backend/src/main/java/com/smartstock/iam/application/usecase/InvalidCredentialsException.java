package com.smartstock.iam.application.usecase;

public class InvalidCredentialsException extends RuntimeException {

  public InvalidCredentialsException() {
    super("Usuario ou senha invalidos.");
  }
}
