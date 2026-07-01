package com.smartstock.catalog.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "unidades_medida")
public class UnitOfMeasureJpaEntity {

  @Id
  private UUID id;

  @Column(name = "sigla", nullable = false, length = 30)
  private String acronym;

  @Column(name = "nome", nullable = false, length = 100)
  private String name;

  @Column(name = "sigla_normalizada", nullable = false, unique = true, length = 40)
  private String normalizedAcronym;

  @Column(name = "nome_normalizado", nullable = false, unique = true, length = 120)
  private String normalizedName;

  @Column(name = "ativo", nullable = false)
  private boolean active;

  @Column(name = "padrao_sistema", nullable = false)
  private boolean systemDefault;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected UnitOfMeasureJpaEntity() {
  }

  public UnitOfMeasureJpaEntity(
      UUID id,
      String acronym,
      String name,
      String normalizedAcronym,
      String normalizedName,
      boolean active,
      boolean systemDefault,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {
    this.id = id;
    this.acronym = acronym;
    this.name = name;
    this.normalizedAcronym = normalizedAcronym;
    this.normalizedName = normalizedName;
    this.active = active;
    this.systemDefault = systemDefault;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getAcronym() {
    return acronym;
  }

  public String getName() {
    return name;
  }

  public boolean isActive() {
    return active;
  }

  public boolean isSystemDefault() {
    return systemDefault;
  }
}
