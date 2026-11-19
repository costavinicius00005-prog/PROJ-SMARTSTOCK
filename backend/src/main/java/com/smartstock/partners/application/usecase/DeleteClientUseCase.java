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
    clientRepository.findById(clientId).orElseThrow(ClientNotFoundException::new);

    // Orcamentos, pedidos e vendas referenciam o cliente (FK ON DELETE RESTRICT)
    if (clientRepository.hasCommercialHistory(clientId)) {
      throw new ClientInUseException(
          "Este cliente possui orcamentos, pedidos ou vendas e nao pode ser excluido.");
    }

    clientRepository.deleteById(clientId);
  }
}
