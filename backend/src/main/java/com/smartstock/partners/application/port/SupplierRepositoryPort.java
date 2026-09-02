package com.smartstock.partners.application.port;

import com.smartstock.partners.domain.Supplier;
import java.util.List;
import java.util.UUID;

public interface SupplierRepositoryPort {
  List<Supplier> list();
  boolean existsByCpf(String cpf);
  boolean existsByCnpj(String cnpj);
  Supplier save(Supplier supplier);
  void deleteById(UUID id);
}
