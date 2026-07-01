package com.smartstock.catalog.application.port;

import com.smartstock.catalog.domain.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepositoryPort {

  List<Category> listActive();

  Optional<Category> findById(UUID id);

  Optional<Category> findByNormalizedName(String normalizedName);

  Category save(Category category, String normalizedName);
}
