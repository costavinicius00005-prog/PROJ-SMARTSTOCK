import type { SalesOrderSummary } from "@/src/domain/sales/sales-order"

export interface SalesOrderRepository {
  list(): SalesOrderSummary[]
}
