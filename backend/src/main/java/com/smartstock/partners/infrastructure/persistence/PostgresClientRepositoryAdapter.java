package com.smartstock.partners.infrastructure.persistence;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.partners.infrastructure.persistence.jpa.ClientJpaEntity;
import com.smartstock.partners.infrastructure.persistence.jpa.SpringDataClientRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PostgresClientRepositoryAdapter implements ClientRepositoryPort {

  private final SpringDataClientRepository repository;

  public PostgresClientRepositoryAdapter(SpringDataClientRepository repository) {
    this.repository = repository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Client> list() {
    return repository.findAll().stream()
        .map(ClientJpaMapper::toDomain)
        .sorted(Comparator.comparing(Client::name))
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByCpf(String cpf) {
    return repository.existsByCpf(cpf);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByCnpj(String cnpj) {
    return repository.existsByCnpj(cnpj);
  }

  @Override
  @Transactional
  public Client save(Client client) {
    ClientJpaEntity savedEntity = repository.save(ClientJpaMapper.toEntity(client));

    return ClientJpaMapper.toDomain(savedEntity);
  }

  @Override
  @Transactional
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }
}
