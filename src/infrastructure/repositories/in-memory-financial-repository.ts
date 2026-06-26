import type { FinancialRepository } from "@/src/application/ports/finance/financial-repository"
import { financialSummary, payables, receivables } from "@/src/infrastructure/mock-data/finance/accounts"

export const inMemoryFinancialRepository: FinancialRepository = {
  getSummary: () => financialSummary,
  listPayables: () => payables,
  listReceivables: () => receivables,
}
