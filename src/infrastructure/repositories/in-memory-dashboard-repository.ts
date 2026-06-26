import type { DashboardRepository } from "@/src/application/ports/dashboard/dashboard-repository"
import { dashboardOverview } from "@/src/infrastructure/mock-data/dashboard/overview"

export const inMemoryDashboardRepository: DashboardRepository = {
  getOverview: () => dashboardOverview,
}
