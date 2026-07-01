package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.CategoryRepositoryPort;
import com.smartstock.catalog.domain.Category;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListCategoriesUseCase {

  private final CategoryRepositoryPort categoryRepository;

  public ListCategoriesUseCase(CategoryRepositoryPort categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  public List<Category> execute() {
    return categoryRepository.listActive();
  }
}
