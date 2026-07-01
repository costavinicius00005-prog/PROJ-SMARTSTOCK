package com.smartstock.catalog.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "categorias")
public class CategoryJpaEntity {

  @Id
  private UUID id;

  @Column(name = "nome", nullable = false, length = 100)
  private String name;

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

  protected CategoryJpaEntity() {
  }

  public CategoryJpaEntity(
      UUID id,
      String name,
      String normalizedName,
      boolean active,
      boolean systemDefault,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {
    this.id = id;
    this.name = name;
    this.normalizedName = normalizedName;
    this.active = active;
    this.systemDefault = systemDefault;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getNormalizedName() {
    return normalizedName;
  }

  public boolean isActive() {
    return active;
  }

  public boolean isSystemDefault() {
    return systemDefault;
  }
}
