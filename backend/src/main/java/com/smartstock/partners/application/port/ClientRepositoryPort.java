package com.smartstock.partners.application.port;

import com.smartstock.partners.domain.Client;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface ClientRepositoryPort {

  List<Client> list();
  Optional<Client> findById(UUID id);

  boolean existsByCpf(String cpf);

  boolean existsByCnpj(String cnpj);

  Client save(Client client);

  void deleteById(UUID id);
}
