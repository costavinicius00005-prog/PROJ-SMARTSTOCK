"use client"

import { useState } from "react"
import { RegisterProduct } from "@/src/application/use-cases/catalog/register-product"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"
import { productRegistrationApi } from "@/src/infrastructure/http/product-registration-api"

const registerProduct = new RegisterProduct(productRegistrationApi)

export function useProductRegistration(initialProduct: ProductRegistration) {
  const [product, setProduct] = useState<ProductRegistration>(initialProduct)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

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

  const submitProduct = async () => {
    setStatus("saving")

    try {
      await registerProduct.execute(product)
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
    updateProduct,
    resetProduct,
    submitProduct,
  }
}
