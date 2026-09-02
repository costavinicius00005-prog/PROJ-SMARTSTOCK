package com.smartstock.partners.infrastructure.web;

import com.smartstock.partners.application.usecase.CreateSupplierCommand;
import com.smartstock.partners.application.usecase.SupplierAlreadyExistsException;
import com.smartstock.partners.application.usecase.CreateSupplierUseCase;
import com.smartstock.partners.application.usecase.DeleteSupplierUseCase;
import com.smartstock.partners.application.usecase.ListSuppliersUseCase;
import com.smartstock.partners.domain.Supplier;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
  private final CreateSupplierUseCase createSupplier;
  private final ListSuppliersUseCase listSuppliers;
  private final DeleteSupplierUseCase deleteSupplier;
  public SupplierController(CreateSupplierUseCase createSupplier, ListSuppliersUseCase listSuppliers,
      DeleteSupplierUseCase deleteSupplier) {
    this.createSupplier = createSupplier; this.listSuppliers = listSuppliers; this.deleteSupplier = deleteSupplier;
  }

  @GetMapping public List<SupplierResponse> list() { return listSuppliers.execute().stream().map(SupplierResponse::from).toList(); }
  @PostMapping @ResponseStatus(HttpStatus.CREATED)
  public SupplierResponse create(@RequestBody SupplierRequest r) {
    return SupplierResponse.from(createSupplier.execute(new CreateSupplierCommand(r.clientType(), r.cpf(), r.cnpj(),
        r.name(), r.tradeName(), r.email(), r.primaryPhone(), r.birthDate(), r.rg(), r.gender(),
        r.motherName(), r.fatherName(), r.primaryContactName(), r.zipCode(), r.address(),
        r.addressNumber(), r.complement(), r.district(), r.state(), r.city())));
  }
  @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable UUID id) {
    deleteSupplier.execute(id); return ResponseEntity.noContent().build();
  }
  @ExceptionHandler(SupplierAlreadyExistsException.class)
  public ResponseEntity<Map<String, String>> duplicate(SupplierAlreadyExistsException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
  }

  public record SupplierRequest(String clientType, String cpf, String cnpj, String name, String tradeName,
      String email, String primaryPhone, LocalDate birthDate, String rg, String gender, String motherName,
      String fatherName, String primaryContactName, String zipCode, String address, String addressNumber,
      String complement, String district, String state, String city) {}

  public record SupplierResponse(UUID id, String clientType, String cpf, String cnpj, String name,
      String tradeName, String email, String primaryPhone, LocalDate birthDate, String rg, String gender,
      String motherName, String fatherName, String primaryContactName, String zipCode, String address,
      String addressNumber, String complement, String district, String state, String city) {
    static SupplierResponse from(Supplier s) { return new SupplierResponse(s.id(), s.supplierType(), s.cpf(),
        s.cnpj(), s.name(), s.tradeName(), s.email(), s.primaryPhone(), s.birthDate(), s.rg(), s.gender(),
        s.motherName(), s.fatherName(), s.primaryContactName(), s.zipCode(), s.address(), s.addressNumber(),
        s.complement(), s.district(), s.state(), s.city()); }
  }
}
