package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import com.smartstock.partners.domain.Supplier;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ListSuppliersUseCase {
  private final SupplierRepositoryPort repository;
  public ListSuppliersUseCase(SupplierRepositoryPort repository) { this.repository = repository; }
  public List<Supplier> execute() { return repository.list(); }
}
