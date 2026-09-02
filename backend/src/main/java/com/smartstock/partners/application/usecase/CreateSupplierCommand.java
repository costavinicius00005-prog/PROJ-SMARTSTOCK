package com.smartstock.partners.application.usecase;

import java.time.LocalDate;

public record CreateSupplierCommand(String supplierType, String cpf, String cnpj, String name,
    String tradeName, String email, String primaryPhone, LocalDate birthDate, String rg,
    String gender, String motherName, String fatherName, String primaryContactName,
    String zipCode, String address, String addressNumber, String complement, String district,
    String state, String city) {
}
