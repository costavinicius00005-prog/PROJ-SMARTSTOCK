import type { StockRepository } from "@/src/application/ports/stock/stock-repository"
import { stockMovements, stockSummary } from "@/src/infrastructure/mock-data/stock/movements"

export const inMemoryStockRepository: StockRepository = {
  getSummary: () => stockSummary,
  listMovements: () => stockMovements,
}
