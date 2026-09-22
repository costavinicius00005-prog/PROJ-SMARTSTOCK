package com.smartstock.iam.infrastructure.persistence;

import com.smartstock.iam.domain.User;
import com.smartstock.iam.infrastructure.persistence.jpa.UserJpaEntity;

public final class UserJpaMapper {

  private UserJpaMapper() {
  }

  public static User toDomain(UserJpaEntity entity) {
    return new User(
        entity.getId(),
        entity.getUsername(),
        entity.getPasswordHash(),
        entity.getDisplayName(),
        entity.getRole().getName(),
        entity.isActive(),
        entity.getCreatedAt());
  }
}
