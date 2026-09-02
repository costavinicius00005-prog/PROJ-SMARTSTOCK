package com.smartstock.partners.domain;

import java.time.LocalDate;
import java.util.UUID;

public record Supplier(UUID id, String supplierType, String cpf, String cnpj, String name,
    String tradeName, String email, String primaryPhone, LocalDate birthDate, String rg,
    String gender, String motherName, String fatherName, String primaryContactName,
    String zipCode, String address, String addressNumber, String complement, String district,
    String state, String city) {
}
