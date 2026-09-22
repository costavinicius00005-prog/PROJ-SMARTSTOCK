package com.smartstock.iam.infrastructure.persistence;

import com.smartstock.iam.application.port.UserRepositoryPort;
import com.smartstock.iam.domain.User;
import com.smartstock.iam.infrastructure.persistence.jpa.RoleJpaEntity;
import com.smartstock.iam.infrastructure.persistence.jpa.SpringDataRoleRepository;
import com.smartstock.iam.infrastructure.persistence.jpa.SpringDataUserRepository;
import com.smartstock.iam.infrastructure.persistence.jpa.UserJpaEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class PostgresUserRepositoryAdapter implements UserRepositoryPort {

  private final SpringDataUserRepository userRepository;
  private final SpringDataRoleRepository roleRepository;

  public PostgresUserRepositoryAdapter(
      SpringDataUserRepository userRepository,
      SpringDataRoleRepository roleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  @Override
  public Optional<User> findByUsername(String username) {
    return userRepository.findByUsername(username).map(UserJpaMapper::toDomain);
  }

  @Override
  public Optional<User> findById(Long id) {
    return userRepository.findById(id).map(UserJpaMapper::toDomain);
  }

  @Override
  public List<User> findAll() {
    return userRepository.findAllByOrderByDisplayNameAsc().stream()
        .map(UserJpaMapper::toDomain)
        .toList();
  }

  @Override
  public User save(User user) {
    RoleJpaEntity role = roleRepository
        .findByName(user.role())
        .orElseThrow(() -> new IllegalArgumentException("Papel invalido: " + user.role()));

    UserJpaEntity entity = userRepository.save(new UserJpaEntity(
        user.id(),
        user.username(),
        user.passwordHash(),
        user.displayName(),
        role,
        user.active(),
        user.createdAt()));

    return UserJpaMapper.toDomain(entity);
  }

  @Override
  public long count() {
    return userRepository.count();
  }
}
