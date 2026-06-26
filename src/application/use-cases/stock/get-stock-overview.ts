import type { StockRepository } from "@/src/application/ports/stock/stock-repository"

export function getStockOverview(repository: StockRepository) {
  return {
    summary: repository.getSummary(),
    movements: repository.listMovements(),
  }
}
