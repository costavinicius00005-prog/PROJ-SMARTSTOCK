package com.smartstock.partners.application.usecase;

public class SupplierNotFoundException extends RuntimeException {

  public SupplierNotFoundException() {
    super("Fornecedor nao encontrado.");
  }
}
