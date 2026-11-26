package com.smartstock.partners.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PersonalDataMaskTest {

  @Test
  void mascaraCpfMantendoApenasOsDigitosCentrais() {
    assertThat(PersonalDataMask.cpf("12345678901")).isEqualTo("***.456.789-**");
    assertThat(PersonalDataMask.cpf("123.456.789-01")).isEqualTo("***.456.789-**");
    assertThat(PersonalDataMask.cpf(null)).isNull();
  }

  @Test
  void mascaraEmail() {
    assertThat(PersonalDataMask.email("joao.silva@gmail.com")).isEqualTo("jo***@gmail.com");
    assertThat(PersonalDataMask.email("a@b.com")).isEqualTo("a***@b.com");
  }
}
