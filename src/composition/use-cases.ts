import { getDashboardOverview } from "@/src/application/use-cases/dashboard/get-dashboard-overview"
import { listProducts } from "@/src/application/use-cases/catalog/list-products"
import { listClients } from "@/src/application/use-cases/partners/list-clients"
import { listSuppliers } from "@/src/application/use-cases/partners/list-suppliers"
import { listSalesOrders } from "@/src/application/use-cases/sales/list-sales-orders"
import { getFinancialOverview } from "@/src/application/use-cases/finance/get-financial-overview"
import { getStockOverview } from "@/src/application/use-cases/stock/get-stock-overview"
import { listFiscalDocuments } from "@/src/application/use-cases/fiscal/list-fiscal-documents"
import { listNavigationMenu } from "@/src/application/use-cases/navigation/list-navigation-menu"
import { inMemoryCatalogRepository } from "@/src/infrastructure/repositories/in-memory-catalog-repository"
import { inMemoryDashboardRepository } from "@/src/infrastructure/repositories/in-memory-dashboard-repository"
import { inMemoryFinancialRepository } from "@/src/infrastructure/repositories/in-memory-financial-repository"
import { inMemoryFiscalDocumentRepository } from "@/src/infrastructure/repositories/in-memory-fiscal-document-repository"
import { inMemoryNavigationRepository } from "@/src/infrastructure/repositories/in-memory-navigation-repository"
import { inMemoryPartyRepository } from "@/src/infrastructure/repositories/in-memory-party-repository"
import { inMemorySalesOrderRepository } from "@/src/infrastructure/repositories/in-memory-sales-order-repository"
import { inMemoryStockRepository } from "@/src/infrastructure/repositories/in-memory-stock-repository"

export const appUseCases = {
  getDashboardOverview: () => getDashboardOverview(inMemoryDashboardRepository),
  listProducts: () => listProducts(inMemoryCatalogRepository),
  listClients: () => listClients(inMemoryPartyRepository),
  listSuppliers: () => listSuppliers(inMemoryPartyRepository),
  listSalesOrders: () => listSalesOrders(inMemorySalesOrderRepository),
  getFinancialOverview: () => getFinancialOverview(inMemoryFinancialRepository),
  getStockOverview: () => getStockOverview(inMemoryStockRepository),
  listFiscalDocuments: () => listFiscalDocuments(inMemoryFiscalDocumentRepository),
  listNavigationMenu: () => listNavigationMenu(inMemoryNavigationRepository),
}
