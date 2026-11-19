package com.smartstock.partners.infrastructure.persistence;

import com.smartstock.partners.application.port.ClientRepositoryPort;
import com.smartstock.partners.domain.Client;
import com.smartstock.partners.infrastructure.persistence.jpa.ClientJpaEntity;
import com.smartstock.partners.infrastructure.persistence.jpa.SpringDataClientRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PostgresClientRepositoryAdapter implements ClientRepositoryPort {

  private final SpringDataClientRepository repository;
  private final JdbcTemplate jdbc;

  public PostgresClientRepositoryAdapter(SpringDataClientRepository repository, JdbcTemplate jdbc) {
    this.repository = repository;
    this.jdbc = jdbc;
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
  public Optional<Client> findById(UUID id) {
    return repository.findById(id).map(ClientJpaMapper::toDomain);
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
    // Preserva a data de cadastro original ao atualizar um cliente existente
    OffsetDateTime createdAt = repository.findById(client.id())
        .map(ClientJpaEntity::getCreatedAt)
        .orElse(null);
    ClientJpaEntity savedEntity = repository.save(ClientJpaMapper.toEntity(client, createdAt));

    return ClientJpaMapper.toDomain(savedEntity);
  }

  @Override
  @Transactional
  public void deleteById(UUID id) {
    repository.deleteById(id);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByCpfForOtherClient(String cpf, UUID clientId) {
    return repository.existsByCpfAndIdNot(cpf, clientId);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByCnpjForOtherClient(String cnpj, UUID clientId) {
    return repository.existsByCnpjAndIdNot(cnpj, clientId);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean hasCommercialHistory(UUID clientId) {
    Boolean exists = jdbc.queryForObject("""
        SELECT EXISTS (SELECT 1 FROM sales_quotes WHERE client_id = ?)
            OR EXISTS (SELECT 1 FROM sales_orders WHERE client_id = ?)
            OR EXISTS (SELECT 1 FROM sales WHERE client_id = ?)
        """, Boolean.class, clientId, clientId, clientId);
    return Boolean.TRUE.equals(exists);
  }
}
