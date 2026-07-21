package com.smartstock.partners.infrastructure.persistence.jpa;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataClientRepository extends JpaRepository<ClientJpaEntity, UUID> {

  boolean existsByCpf(String cpf);

  boolean existsByCnpj(String cnpj);
}
