package com.smartstock.iam.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataUserRepository extends JpaRepository<UserJpaEntity, Long> {

  Optional<UserJpaEntity> findByUsername(String username);

  List<UserJpaEntity> findAllByOrderByDisplayNameAsc();
}
