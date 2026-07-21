package com.smartstock.partners.application.port;

import com.smartstock.partners.domain.Client;
import java.util.List;
import java.util.UUID;

public interface ClientRepositoryPort {

  List<Client> list();

  boolean existsByCpf(String cpf);

  boolean existsByCnpj(String cnpj);

  Client save(Client client);

  void deleteById(UUID id);
}
