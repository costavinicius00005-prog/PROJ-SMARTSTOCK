package com.smartstock.iam.application.usecase;

public class UserNotFoundException extends RuntimeException {

  public UserNotFoundException(Long id) {
    super("Usuario " + id + " nao encontrado.");
  }
}
