package com.smartstock.catalog.infrastructure.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
public class ProductJpaEntity {

  @Id
  private UUID id;

  @Column(nullable = false, length = 160)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "categoria_id", nullable = false)
  private CategoryJpaEntity category;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "marca_id", nullable = false)
  private BrandJpaEntity brand;

  @Column(name = "internal_code", nullable = false, unique = true, length = 80)
  private String internalCode;

  @Column(name = "variation_type", length = 80)
  private String variationType;

  @Column(columnDefinition = "text")
  private String description;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "unidade_medida_id", nullable = false)
  private UnitOfMeasureJpaEntity unitOfMeasure;

  @Column(name = "cost_value", nullable = false, precision = 12, scale = 2)
  private BigDecimal costValue;

  @Column(name = "sale_markup", nullable = false, precision = 8, scale = 4)
  private BigDecimal saleMarkup;

  @Column(name = "sale_price", nullable = false, precision = 12, scale = 2)
  private BigDecimal salePrice;

  @Column(unique = true, length = 80)
  private String barcode;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected ProductJpaEntity() {
  }

  public ProductJpaEntity(
      UUID id,
      String name,
      CategoryJpaEntity category,
      BrandJpaEntity brand,
      String internalCode,
      String variationType,
      String description,
      UnitOfMeasureJpaEntity unitOfMeasure,
      BigDecimal costValue,
      BigDecimal saleMarkup,
      BigDecimal salePrice,
      String barcode,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.brand = brand;
    this.internalCode = internalCode;
    this.variationType = variationType;
    this.description = description;
    this.unitOfMeasure = unitOfMeasure;
    this.costValue = costValue;
    this.saleMarkup = saleMarkup;
    this.salePrice = salePrice;
    this.barcode = barcode;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public CategoryJpaEntity getCategory() {
    return category;
  }

  public BrandJpaEntity getBrand() {
    return brand;
  }

  public String getInternalCode() {
    return internalCode;
  }

  public String getVariationType() {
    return variationType;
  }

  public String getDescription() {
    return description;
  }

  public UnitOfMeasureJpaEntity getUnitOfMeasure() {
    return unitOfMeasure;
  }

  public BigDecimal getCostValue() {
    return costValue;
  }

  public BigDecimal getSaleMarkup() {
    return saleMarkup;
  }

  public BigDecimal getSalePrice() {
    return salePrice;
  }

  public String getBarcode() {
    return barcode;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
