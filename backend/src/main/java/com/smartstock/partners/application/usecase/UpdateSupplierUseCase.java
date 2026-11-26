package com.smartstock.partners.application.usecase;

import com.smartstock.partners.application.port.SupplierRepositoryPort;
import com.smartstock.partners.domain.Supplier;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpdateSupplierUseCase {
  private final SupplierRepositoryPort repository;

  public UpdateSupplierUseCase(SupplierRepositoryPort repository) {
    this.repository = repository;
  }

  @Transactional
  public Supplier execute(UUID id, CreateSupplierCommand command) {
    var previous = repository.findById(id).orElseThrow(SupplierNotFoundException::new);

    String name = clean(command.name());
    String cpf = ClientInputSanitizer.documentToNull(command.cpf());
    String cnpj = ClientInputSanitizer.documentToNull(command.cnpj());
    if (name == null) {
      throw new IllegalArgumentException("Nome do fornecedor e obrigatorio.");
    }
    DocumentRules.validate(cpf, cnpj, previous.cpf(), previous.cnpj());
    if (cpf != null && repository.existsByCpfForOtherSupplier(cpf, id)) {
      throw new SupplierAlreadyExistsException("Ja existe outro fornecedor cadastrado com este CPF.");
    }
    if (cnpj != null && repository.existsByCnpjForOtherSupplier(cnpj, id)) {
      throw new SupplierAlreadyExistsException("Ja existe outro fornecedor cadastrado com este CNPJ.");
    }

    return repository.update(new Supplier(id,
        "Pessoa fisica".equals(command.supplierType()) ? "Pessoa fisica" : "Pessoa juridica",
        cpf, cnpj, name, clean(command.tradeName()), clean(command.email()), clean(command.primaryPhone()),
        command.birthDate(), clean(command.rg()), clean(command.gender()), clean(command.motherName()),
        clean(command.fatherName()), clean(command.primaryContactName()), clean(command.zipCode()),
        clean(command.address()), clean(command.addressNumber()), clean(command.complement()),
        clean(command.district()), clean(command.state()), clean(command.city())));
  }

  private String clean(String value) {
    return ClientInputSanitizer.blankToNull(value);
  }
}
