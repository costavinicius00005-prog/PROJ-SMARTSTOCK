package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListClientsUseCase {

  private final ClientRepositoryPort clientRepository;

  public ListClientsUseCase(ClientRepositoryPort clientRepository) {
    this.clientRepository = clientRepository;
  }

  public List<Client> execute() {
    return clientRepository.list();
  }
}
