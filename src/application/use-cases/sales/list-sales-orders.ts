import type { SalesOrderRepository } from "@/src/application/ports/sales/sales-order-repository"

export function listSalesOrders(repository: SalesOrderRepository) {
  return repository.list()
}
