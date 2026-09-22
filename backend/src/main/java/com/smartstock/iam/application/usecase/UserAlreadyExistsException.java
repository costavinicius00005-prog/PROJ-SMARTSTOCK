package com.smartstock.iam.application.usecase;

public class UserAlreadyExistsException extends RuntimeException {

  public UserAlreadyExistsException(String username) {
    super("Ja existe um usuario com o identificador '" + username + "'.");
  }
}
