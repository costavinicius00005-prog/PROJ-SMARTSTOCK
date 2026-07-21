package com.smartstock.partners.infrastructure.web;

import com.smartstock.partners.domain.Client;
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
    String city) {

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
        client.city());
  }
}
