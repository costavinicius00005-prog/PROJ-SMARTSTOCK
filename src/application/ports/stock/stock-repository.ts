import type { StockMovement, StockSummary } from "@/src/domain/stock/stock-movement"

export interface StockRepository {
  getSummary(): StockSummary
  listMovements(): StockMovement[]
}
