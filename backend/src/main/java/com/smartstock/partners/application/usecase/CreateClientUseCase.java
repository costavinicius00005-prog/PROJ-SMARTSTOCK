package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateClientUseCase {

  private final ClientRepositoryPort clientRepository;

  public CreateClientUseCase(ClientRepositoryPort clientRepository) {
    this.clientRepository = clientRepository;
  }

  public Client execute(CreateClientCommand command) {
    String name = ClientInputSanitizer.blankToNull(command.name());
    String cpf = ClientInputSanitizer.documentToNull(command.cpf());
    String cnpj = ClientInputSanitizer.documentToNull(command.cnpj());

    if (name == null) {
      throw new IllegalArgumentException("Nome do cliente e obrigatorio.");
    }

    if (cpf != null && clientRepository.existsByCpf(cpf)) {
      throw new ClientAlreadyExistsException("Ja existe um cliente cadastrado com este CPF.");
    }

    if (cnpj != null && clientRepository.existsByCnpj(cnpj)) {
      throw new ClientAlreadyExistsException("Ja existe um cliente cadastrado com este CNPJ.");
    }

    Client client = new Client(
        UUID.randomUUID(),
        resolveClientType(command.clientType()),
        cpf,
        cnpj,
        name,
        ClientInputSanitizer.blankToNull(command.tradeName()),
        ClientInputSanitizer.blankToNull(command.email()),
        ClientInputSanitizer.blankToNull(command.primaryPhone()),
        command.birthDate(),
        ClientInputSanitizer.blankToNull(command.rg()),
        ClientInputSanitizer.blankToNull(command.gender()),
        ClientInputSanitizer.blankToNull(command.motherName()),
        ClientInputSanitizer.blankToNull(command.fatherName()),
        ClientInputSanitizer.blankToNull(command.primaryContactName()),
        ClientInputSanitizer.blankToNull(command.zipCode()),
        ClientInputSanitizer.blankToNull(command.address()),
        ClientInputSanitizer.blankToNull(command.addressNumber()),
        ClientInputSanitizer.blankToNull(command.complement()),
        ClientInputSanitizer.blankToNull(command.district()),
        ClientInputSanitizer.blankToNull(command.state()),
        ClientInputSanitizer.blankToNull(command.city()));

    return clientRepository.save(client);
  }

  private String resolveClientType(String clientType) {
    if ("Pessoa fisica".equals(clientType)) {
      return "Pessoa fisica";
    }

    return "Pessoa juridica";
  }
}
