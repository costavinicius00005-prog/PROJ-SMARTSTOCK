import type { FinancialRepository } from "@/src/application/ports/finance/financial-repository"

export function getFinancialOverview(repository: FinancialRepository) {
  return {
    summary: repository.getSummary(),
    payables: repository.listPayables(),
    receivables: repository.listReceivables(),
  }
}
