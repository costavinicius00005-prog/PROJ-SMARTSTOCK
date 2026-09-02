package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DeleteSupplierUseCase {
  private final SupplierRepositoryPort repository;
  public DeleteSupplierUseCase(SupplierRepositoryPort repository) { this.repository = repository; }
  public void execute(UUID id) { repository.deleteById(id); }
}
