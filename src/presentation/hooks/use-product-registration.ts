"use client"

import { useEffect, useState } from "react"
import { RegisterProduct } from "@/src/application/use-cases/catalog/register-product"
import type { CatalogOption } from "@/src/domain/catalog/catalog-option"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"
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
    setProduct((current) => ({
      ...current,
      [field]: value,
    }))
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

function upsertOption(options: CatalogOption[], option: CatalogOption) {
  const nextOptions = options.filter((current) => current.id !== option.id)
  nextOptions.push(option)

  return nextOptions.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
}
