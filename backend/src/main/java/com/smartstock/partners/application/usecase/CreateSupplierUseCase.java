package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import com.smartstock.partners.domain.Supplier;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreateSupplierUseCase {
  private final SupplierRepositoryPort repository;
  public CreateSupplierUseCase(SupplierRepositoryPort repository) { this.repository = repository; }

  public Supplier execute(CreateSupplierCommand command) {
    String name = clean(command.name());
    String cpf = ClientInputSanitizer.documentToNull(command.cpf());
    String cnpj = ClientInputSanitizer.documentToNull(command.cnpj());
    if (name == null) throw new IllegalArgumentException("Nome do fornecedor e obrigatorio.");
    if (cpf != null && repository.existsByCpf(cpf)) throw new SupplierAlreadyExistsException("Ja existe um fornecedor cadastrado com este CPF.");
    if (cnpj != null && repository.existsByCnpj(cnpj)) throw new SupplierAlreadyExistsException("Ja existe um fornecedor cadastrado com este CNPJ.");
    return repository.save(new Supplier(UUID.randomUUID(), resolveType(command.supplierType()), cpf, cnpj,
        name, clean(command.tradeName()), clean(command.email()), clean(command.primaryPhone()), command.birthDate(),
        clean(command.rg()), clean(command.gender()), clean(command.motherName()), clean(command.fatherName()),
        clean(command.primaryContactName()), clean(command.zipCode()), clean(command.address()),
        clean(command.addressNumber()), clean(command.complement()), clean(command.district()), clean(command.state()), clean(command.city())));
  }
  private String clean(String value) { return ClientInputSanitizer.blankToNull(value); }
  private String resolveType(String value) { return "Pessoa fisica".equals(value) ? value : "Pessoa juridica"; }
}
