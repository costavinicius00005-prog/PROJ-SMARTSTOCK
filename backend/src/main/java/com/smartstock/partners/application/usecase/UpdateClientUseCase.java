package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateClientUseCase {

  private final ClientRepositoryPort clientRepository;

  public UpdateClientUseCase(ClientRepositoryPort clientRepository) {
    this.clientRepository = clientRepository;
  }

  @Transactional
  public Client execute(UUID clientId, CreateClientCommand command) {
    clientRepository.findById(clientId).orElseThrow(ClientNotFoundException::new);

    String name = ClientInputSanitizer.blankToNull(command.name());
    String cpf = ClientInputSanitizer.documentToNull(command.cpf());
    String cnpj = ClientInputSanitizer.documentToNull(command.cnpj());

    if (name == null) {
      throw new IllegalArgumentException("Nome do cliente e obrigatorio.");
    }
    if (cpf != null && clientRepository.existsByCpfForOtherClient(cpf, clientId)) {
      throw new ClientAlreadyExistsException("Ja existe outro cliente cadastrado com este CPF.");
    }
    if (cnpj != null && clientRepository.existsByCnpjForOtherClient(cnpj, clientId)) {
      throw new ClientAlreadyExistsException("Ja existe outro cliente cadastrado com este CNPJ.");
    }

    Client client = new Client(
        clientId,
        "Pessoa fisica".equals(command.clientType()) ? "Pessoa fisica" : "Pessoa juridica",
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
        ClientInputSanitizer.blankToNull(command.city()),
        ClientInputSanitizer.creditLimit(command.creditLimit()));

    return clientRepository.save(client);
  }
}
