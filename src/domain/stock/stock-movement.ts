import type { MovementDirection } from "@/src/domain/shared/status"

export interface StockMovement {
  id: number
  date: string
  product: string
  type: MovementDirection
  quantity: string
  origin: string
  stock: string
}

export interface StockSummary {
  totalProducts: string
  monthlyEntries: string
  monthlyOutputs: string
}
