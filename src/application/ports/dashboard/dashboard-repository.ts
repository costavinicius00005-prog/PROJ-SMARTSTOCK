import type { DashboardOverview } from "@/src/domain/dashboard/dashboard"

export interface DashboardRepository {
  getOverview(): DashboardOverview
}
