package com.smartstock.iam.infrastructure.persistence.jpa;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataRoleRepository extends JpaRepository<RoleJpaEntity, Long> {

  Optional<RoleJpaEntity> findByName(String name);
}
