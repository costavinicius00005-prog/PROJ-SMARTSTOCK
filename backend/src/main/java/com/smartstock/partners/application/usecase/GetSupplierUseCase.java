package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import com.smartstock.partners.domain.Supplier;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class GetSupplierUseCase {
  private final SupplierRepositoryPort repository;

  public GetSupplierUseCase(SupplierRepositoryPort repository) {
    this.repository = repository;
  }

  public Supplier execute(UUID id) {
    return repository.findById(id).orElseThrow(SupplierNotFoundException::new);
  }
}
