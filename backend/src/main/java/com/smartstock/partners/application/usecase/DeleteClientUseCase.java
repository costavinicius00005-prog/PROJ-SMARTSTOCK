package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DeleteClientUseCase {

  private final ClientRepositoryPort clientRepository;

  public DeleteClientUseCase(ClientRepositoryPort clientRepository) {
    this.clientRepository = clientRepository;
  }

  public void execute(UUID clientId) {
    clientRepository.deleteById(clientId);
  }
}
