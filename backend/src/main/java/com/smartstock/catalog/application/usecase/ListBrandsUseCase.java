package com.smartstock.catalog.application.usecase;

import com.smartstock.catalog.application.port.BrandRepositoryPort;
import com.smartstock.catalog.domain.Brand;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListBrandsUseCase {

  private final BrandRepositoryPort brandRepository;

  public ListBrandsUseCase(BrandRepositoryPort brandRepository) {
    this.brandRepository = brandRepository;
  }

  public List<Brand> execute() {
    return brandRepository.listActive();
  }
}
