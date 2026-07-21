"use client"

import { useEffect, useState } from "react"
import { RegisterProduct } from "@/src/application/use-cases/catalog/register-product"
import type { CatalogOption } from "@/src/domain/catalog/catalog-option"
import {
  calculateSaleMarkup,
  calculateSalePrice,
} from "@/src/domain/catalog/product-pricing"
import type {
  ProductPricingFieldValue,
  ProductRegistration,
} from "@/src/domain/catalog/product-registration"
import {
  createCatalogOption,
  listCatalogOptions,
} from "@/src/infrastructure/http/catalog-options-api"
import { productRegistrationApi } from "@/src/infrastructure/http/product-registration-api"

const registerProduct = new RegisterProduct(productRegistrationApi)
type OptionGroup = "categories" | "brands" | "units-of-measure"

export function useProductRegistration(initialProduct: ProductRegistration, productId?: string) {
  const [product, setProduct] = useState<ProductRegistration>(initialProduct)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [optionsStatus, setOptionsStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [categories, setCategories] = useState<CatalogOption[]>([])
  const [brands, setBrands] = useState<CatalogOption[]>([])
  const [unitsOfMeasure, setUnitsOfMeasure] = useState<CatalogOption[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      setOptionsStatus("loading")

      try {
        const [loadedCategories, loadedBrands, loadedUnits] = await Promise.all([
          listCatalogOptions("categories"),
          listCatalogOptions("brands"),
          listCatalogOptions("units-of-measure"),
        ])

        setCategories(loadedCategories)
        setBrands(loadedBrands)
        setUnitsOfMeasure(loadedUnits)
        setOptionsStatus("loaded")
      } catch {
        setOptionsStatus("error")
      }
    }

    loadOptions()
  }, [])

  const updateProduct = <Field extends keyof ProductRegistration>(
    field: Field,
    value: ProductRegistration[Field],
  ) => {
    setProduct((current) => applyProductChange(current, field, value))
  }

  const resetProduct = () => {
    setProduct(initialProduct)
    setStatus("idle")
  }

  const createAndSelectOption = async (group: OptionGroup, value: string) => {
    const option = await createCatalogOption(group, value)

    if (group === "categories") {
      setCategories((current) => upsertOption(current, option))
      updateProduct("categoryId", option.id)
    }

    if (group === "brands") {
      setBrands((current) => upsertOption(current, option))
      updateProduct("brandId", option.id)
    }

    if (group === "units-of-measure") {
      setUnitsOfMeasure((current) => upsertOption(current, option))
      updateProduct("unitOfMeasureId", option.id)
    }
  }

  const submitProduct = async () => {
    if (!product.categoryId || !product.brandId || !product.unitOfMeasureId) {
      setStatus("error")
      return false
    }

    setStatus("saving")

    try {
      if (productId) {
        await productRegistrationApi.update(productId, product)
      } else {
        await registerProduct.execute(product)
      }

      setStatus("saved")
      return true
    } catch {
      setStatus("error")
      return false
    }
  }

  return {
    product,
    status,
    optionsStatus,
    categories,
    brands,
    unitsOfMeasure,
    updateProduct,
    createAndSelectOption,
    resetProduct,
    submitProduct,
  }
}

function applyProductChange<Field extends keyof ProductRegistration>(
  product: ProductRegistration,
  field: Field,
  value: ProductRegistration[Field],
): ProductRegistration {
  const nextProduct = {
    ...product,
    [field]: value,
  }

  if (field === "costValue") {
    const costValue = toPricingNumber(value as ProductPricingFieldValue)
    const saleMarkup = toPricingNumber(product.saleMarkup)

    return {
      ...nextProduct,
      salePrice: value === "" ? "" : calculateSalePrice(costValue, saleMarkup),
    }
  }

  if (field === "saleMarkup") {
    const costValue = toPricingNumber(product.costValue)
    const saleMarkup = toPricingNumber(value as ProductPricingFieldValue)

    return {
      ...nextProduct,
      salePrice: value === "" ? "" : calculateSalePrice(costValue, saleMarkup),
    }
  }

  if (field === "salePrice") {
    const costValue = toPricingNumber(product.costValue)
    const salePrice = toPricingNumber(value as ProductPricingFieldValue)

    return {
      ...nextProduct,
      saleMarkup: value === "" ? "" : calculateSaleMarkup(costValue, salePrice),
    }
  }

  return nextProduct
}

function toPricingNumber(value: ProductPricingFieldValue) {
  return value === "" ? 0 : value
}

function upsertOption(options: CatalogOption[], option: CatalogOption) {
  const nextOptions = options.filter((current) => current.id !== option.id)
  nextOptions.push(option)

  return nextOptions.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
}
