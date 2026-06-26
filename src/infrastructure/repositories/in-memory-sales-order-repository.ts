import type { SalesOrderRepository } from "@/src/application/ports/sales/sales-order-repository"
import { salesOrders } from "@/src/infrastructure/mock-data/sales/sales-orders"

export const inMemorySalesOrderRepository: SalesOrderRepository = {
  list: () => salesOrders,
}
