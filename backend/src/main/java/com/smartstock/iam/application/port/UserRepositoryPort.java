package com.smartstock.iam.application.port;

import com.smartstock.iam.domain.User;
import java.util.List;
import java.util.Optional;

public interface UserRepositoryPort {

  Optional<User> findByUsername(String username);

  Optional<User> findById(Long id);

  List<User> findAll();

  User save(User user);

  long count();
}
