package com.smartstock.partners.infrastructure.web;

/**
 * Mascaramento de dados pessoais nas listagens (LGPD art. 6, III - necessidade/minimizacao).
 * A ficha completa so sai no endpoint de detalhe, que e registrado na trilha de seguranca.
 */
final class PersonalDataMask {

  private PersonalDataMask() {
  }

  /** CPF 12345678901 -> ***.456.789-** (padrao usado por orgaos publicos na divulgacao de CPF). */
  static String cpf(String cpf) {
    if (cpf == null) {
      return null;
    }
    String digits = cpf.replaceAll("\\D", "");
    if (digits.length() != 11) {
      return "***";
    }
    return "***." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-**";
  }

  /** joao.silva@gmail.com -> jo***@gmail.com */
  static String email(String email) {
    if (email == null || email.isBlank()) {
      return email;
    }
    int at = email.indexOf('@');
    if (at <= 0) {
      return "***";
    }
    String user = email.substring(0, at);
    String visible = user.length() <= 2 ? user.substring(0, 1) : user.substring(0, 2);
    return visible + "***" + email.substring(at);
  }
}
