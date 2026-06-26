import type { ProductLine, SalesOrderTotals } from "@/src/domain/sales/sales-order"

export function createEmptyProductLine(id: number): ProductLine {
  return {
    id,
    name: "",
    quantity: 0,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
  }
}

export function recalculateProductLine(line: ProductLine): ProductLine {
  return {
    ...line,
    subtotal: line.quantity * line.unitPrice - line.discount,
  }
}

export function calculateSalesOrderTotals(products: ProductLine[]): SalesOrderTotals {
  return products.reduce<SalesOrderTotals>(
    (totals, product) => ({
      totalItems: totals.totalItems + product.quantity,
      totalDiscount: totals.totalDiscount + product.discount,
      total: totals.total + product.subtotal,
    }),
    { totalItems: 0, totalDiscount: 0, total: 0 }
  )
}
