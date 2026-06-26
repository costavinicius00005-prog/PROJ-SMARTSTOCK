import type {
  FinancialSummary,
  PayableAccount,
  ReceivableAccount,
} from "@/src/domain/finance/account"

export interface FinancialRepository {
  getSummary(): FinancialSummary
  listPayables(): PayableAccount[]
  listReceivables(): ReceivableAccount[]
}
