package com.smartstock.partners.domain;

/**
 * Validacao dos digitos verificadores de CPF e CNPJ (algoritmo modulo 11 da Receita Federal).
 * Recebe apenas digitos (a mascara ja foi removida pelo sanitizador).
 */
public final class BrazilianDocument {

  private BrazilianDocument() {
  }

  public static boolean isValidCpf(String digits) {
    if (digits == null || !digits.matches("\\d{11}") || allSameDigit(digits)) {
      return false;
    }
    return checkDigit(digits, 9, 10) == digits.charAt(9) - '0'
        && checkDigit(digits, 10, 11) == digits.charAt(10) - '0';
  }

  public static boolean isValidCnpj(String digits) {
    if (digits == null || !digits.matches("\\d{14}") || allSameDigit(digits)) {
      return false;
    }
    int[] first = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    int[] second = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    return cnpjDigit(digits, first) == digits.charAt(12) - '0'
        && cnpjDigit(digits, second) == digits.charAt(13) - '0';
  }

  private static int checkDigit(String digits, int length, int startWeight) {
    int sum = 0;
    for (int i = 0; i < length; i++) {
      sum += (digits.charAt(i) - '0') * (startWeight - i);
    }
    int rest = (sum * 10) % 11;
    return rest == 10 ? 0 : rest;
  }

  private static int cnpjDigit(String digits, int[] weights) {
    int sum = 0;
    for (int i = 0; i < weights.length; i++) {
      sum += (digits.charAt(i) - '0') * weights[i];
    }
    int rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  }

  private static boolean allSameDigit(String digits) {
    return digits.chars().distinct().count() == 1;
  }
}
