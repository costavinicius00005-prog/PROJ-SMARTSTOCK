package com.smartstock.receivables.domain;

/**
 * Violacao de regra de negocio do crediario. Estende IllegalArgumentException para que o tratamento
 * global ja existente devolva HTTP 400 com a mensagem (inclusive quando ocorre dentro da venda do caixa).
 */
public class ReceivableRuleViolation extends IllegalArgumentException {

  public ReceivableRuleViolation(String message) {
    super(message);
  }
}
