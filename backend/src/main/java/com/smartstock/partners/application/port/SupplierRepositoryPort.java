package com.smartstock.partners.application.port;

import com.smartstock.partners.domain.Supplier;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepositoryPort {
  List<Supplier> list();
  Optional<Supplier> findById(UUID id);
  boolean existsByCpfForOtherSupplier(String cpf, UUID id);
  boolean existsByCnpjForOtherSupplier(String cnpj, UUID id);
  Supplier update(Supplier supplier);
  boolean existsByCpf(String cpf);
  boolean existsByCnpj(String cnpj);
  Supplier save(Supplier supplier);
  void deleteById(UUID id);
}
