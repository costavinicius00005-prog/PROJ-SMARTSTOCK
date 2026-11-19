package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetClientUseCase {

  private final ClientRepositoryPort clientRepository;

  public GetClientUseCase(ClientRepositoryPort clientRepository) {
    this.clientRepository = clientRepository;
  }

  public Client execute(UUID clientId) {
    return clientRepository.findById(clientId).orElseThrow(ClientNotFoundException::new);
  }
}
