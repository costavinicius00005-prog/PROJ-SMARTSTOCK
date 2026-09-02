package com.smartstock.partners.application.usecase;

public class SupplierAlreadyExistsException extends RuntimeException {
  public SupplierAlreadyExistsException(String message) { super(message); }
}
