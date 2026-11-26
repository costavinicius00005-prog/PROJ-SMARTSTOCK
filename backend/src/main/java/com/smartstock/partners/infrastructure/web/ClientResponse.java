package com.smartstock.partners.infrastructure.web;

import com.smartstock.partners.domain.Client;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ClientResponse(
    UUID id,
    String clientType,
    String cpf,
    String cnpj,
    String name,
    String tradeName,
    String email,
    String primaryPhone,
    LocalDate birthDate,
    String rg,
    String gender,
    String motherName,
    String fatherName,
    String primaryContactName,
    String zipCode,
    String address,
    String addressNumber,
    String complement,
    String district,
    String state,
    String city,
    BigDecimal creditLimit) {

  public static ClientResponse fromDomain(Client client) {
    return new ClientResponse(
        client.id(),
        client.clientType(),
        client.cpf(),
        client.cnpj(),
        client.name(),
        client.tradeName(),
        client.email(),
        client.primaryPhone(),
        client.birthDate(),
        client.rg(),
        client.gender(),
        client.motherName(),
        client.fatherName(),
        client.primaryContactName(),
        client.zipCode(),
        client.address(),
        client.addressNumber(),
        client.complement(),
        client.district(),
        client.state(),
        client.city(),
        client.creditLimit());
  }

  /**
   * Versao para listagens: CPF e e-mail mascarados e sem RG, nascimento, genero e filiacao.
   * Nome, telefone e endereco continuam visiveis porque vendas e entregas dependem deles.
   */
  public static ClientResponse forListing(Client client) {
    return new ClientResponse(
        client.id(),
        client.clientType(),
        PersonalDataMask.cpf(client.cpf()),
        client.cnpj(),
        client.name(),
        client.tradeName(),
        PersonalDataMask.email(client.email()),
        client.primaryPhone(),
        null,
        null,
        null,
        null,
        null,
        client.primaryContactName(),
        client.zipCode(),
        client.address(),
        client.addressNumber(),
        client.complement(),
        client.district(),
        client.state(),
        client.city(),
        client.creditLimit());
  }
}
