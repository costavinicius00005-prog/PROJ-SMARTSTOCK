export type SalesOrderStatus = "Orcamento" | "Faturado" | "Pendente" | "Cancelado"

export interface SalesOrderSummary {
  id: number
  number: string
  date: string
  client: string
  total: string
  status: SalesOrderStatus
}

export interface ProductLine {
  id: number
  name: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface SalesOrderTotals {
  totalItems: number
  totalDiscount: number
  total: number
}
