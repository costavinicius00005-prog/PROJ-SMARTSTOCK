"use client"

import { useMemo, useState } from "react"
import {
  calculateSalesOrderTotals,
  createEmptyProductLine,
  recalculateProductLine,
} from "@/src/application/use-cases/sales/calculate-sales-order-totals"
import type { ProductLine } from "@/src/domain/sales/sales-order"

export function useSalesOrderDraft() {
  const [products, setProducts] = useState<ProductLine[]>([createEmptyProductLine(1)])

  const addProduct = () => {
    setProducts((current) => [...current, createEmptyProductLine(current.length + 1)])
  }

  const removeProduct = (id: number) => {
    setProducts((current) => {
      if (current.length <= 1) {
        return current
      }

      return current.filter((product) => product.id !== id)
    })
  }

  const updateProduct = (id: number, field: keyof ProductLine, value: string | number) => {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== id) {
          return product
        }

        return recalculateProductLine({ ...product, [field]: value })
      })
    )
  }

  const totals = useMemo(() => calculateSalesOrderTotals(products), [products])

  return {
    products,
    totals,
    addProduct,
    removeProduct,
    updateProduct,
  }
}
