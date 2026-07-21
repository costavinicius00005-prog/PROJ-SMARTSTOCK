package com.smartstock.partners.infrastructure.persistence;

import com.smartstock.partners.domain.Client;
import com.smartstock.partners.infrastructure.persistence.jpa.ClientJpaEntity;
import java.time.OffsetDateTime;

public final class ClientJpaMapper {

  private ClientJpaMapper() {
  }

  public static Client toDomain(ClientJpaEntity entity) {
    return new Client(
        entity.getId(),
        entity.getClientType(),
        entity.getCpf(),
        entity.getCnpj(),
        entity.getName(),
        entity.getTradeName(),
        entity.getEmail(),
        entity.getPrimaryPhone(),
        entity.getBirthDate(),
        entity.getRg(),
        entity.getGender(),
        entity.getMotherName(),
        entity.getFatherName(),
        entity.getPrimaryContactName(),
        entity.getZipCode(),
        entity.getAddress(),
        entity.getAddressNumber(),
        entity.getComplement(),
        entity.getDistrict(),
        entity.getState(),
        entity.getCity());
  }

  public static ClientJpaEntity toEntity(Client client) {
    OffsetDateTime now = OffsetDateTime.now();

    return new ClientJpaEntity(
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
        now,
        now);
  }
}
