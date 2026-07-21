package com.smartstock.partners.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "clients")
public class ClientJpaEntity {

  @Id
  private UUID id;

  @Column(name = "client_type", nullable = false, length = 30)
  private String clientType;

  @Column(length = 20)
  private String cpf;

  @Column(length = 24)
  private String cnpj;

  @Column(nullable = false, length = 160)
  private String name;

  @Column(name = "trade_name", length = 160)
  private String tradeName;

  @Column(length = 160)
  private String email;

  @Column(name = "primary_phone", length = 40)
  private String primaryPhone;

  @Column(name = "birth_date")
  private LocalDate birthDate;

  @Column(length = 40)
  private String rg;

  @Column(length = 40)
  private String gender;

  @Column(name = "mother_name", length = 160)
  private String motherName;

  @Column(name = "father_name", length = 160)
  private String fatherName;

  @Column(name = "primary_contact_name", length = 160)
  private String primaryContactName;

  @Column(name = "zip_code", length = 20)
  private String zipCode;

  @Column(length = 180)
  private String address;

  @Column(name = "address_number", length = 30)
  private String addressNumber;

  @Column(length = 120)
  private String complement;

  @Column(length = 120)
  private String district;

  @Column(length = 80)
  private String state;

  @Column(length = 120)
  private String city;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected ClientJpaEntity() {
  }

  public ClientJpaEntity(
      UUID id,
      String clientType,
      String cpf,
      String cnpj,
      String name,
      String tradeName,
      String email,
      String primaryPhone,
      LocalDate birthDate,
      String rg,
      String gender,
      String motherName,
      String fatherName,
      String primaryContactName,
      String zipCode,
      String address,
      String addressNumber,
      String complement,
      String district,
      String state,
      String city,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {
    this.id = id;
    this.clientType = clientType;
    this.cpf = cpf;
    this.cnpj = cnpj;
    this.name = name;
    this.tradeName = tradeName;
    this.email = email;
    this.primaryPhone = primaryPhone;
    this.birthDate = birthDate;
    this.rg = rg;
    this.gender = gender;
    this.motherName = motherName;
    this.fatherName = fatherName;
    this.primaryContactName = primaryContactName;
    this.zipCode = zipCode;
    this.address = address;
    this.addressNumber = addressNumber;
    this.complement = complement;
    this.district = district;
    this.state = state;
    this.city = city;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getClientType() {
    return clientType;
  }

  public String getCpf() {
    return cpf;
  }

  public String getCnpj() {
    return cnpj;
  }

  public String getName() {
    return name;
  }

  public String getTradeName() {
    return tradeName;
  }

  public String getEmail() {
    return email;
  }

  public String getPrimaryPhone() {
    return primaryPhone;
  }

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public String getRg() {
    return rg;
  }

  public String getGender() {
    return gender;
  }

  public String getMotherName() {
    return motherName;
  }

  public String getFatherName() {
    return fatherName;
  }

  public String getPrimaryContactName() {
    return primaryContactName;
  }

  public String getZipCode() {
    return zipCode;
  }

  public String getAddress() {
    return address;
  }

  public String getAddressNumber() {
    return addressNumber;
  }

  public String getComplement() {
    return complement;
  }

  public String getDistrict() {
    return district;
  }

  public String getState() {
    return state;
  }

  public String getCity() {
    return city;
  }
}
