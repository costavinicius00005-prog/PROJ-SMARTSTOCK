package com.smartstock.partners.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class BrazilianDocumentTest {

  @Test void acceptsValidCpf() {
    assertTrue(BrazilianDocument.isValidCpf("52998224725"));
    assertTrue(BrazilianDocument.isValidCpf("11144477735"));
  }

  @Test void rejectsInvalidCpf() {
    assertFalse(BrazilianDocument.isValidCpf("52998224724"));
    assertFalse(BrazilianDocument.isValidCpf("11111111111"));
    assertFalse(BrazilianDocument.isValidCpf("1234567890"));
    assertFalse(BrazilianDocument.isValidCpf(null));
  }

  @Test void acceptsValidCnpj() {
    assertTrue(BrazilianDocument.isValidCnpj("11222333000181"));
    assertTrue(BrazilianDocument.isValidCnpj("11444777000161"));
  }

  @Test void rejectsInvalidCnpj() {
    assertFalse(BrazilianDocument.isValidCnpj("11222333000182"));
    assertFalse(BrazilianDocument.isValidCnpj("00000000000000"));
    assertFalse(BrazilianDocument.isValidCnpj("1122233300018"));
  }
}
