import type { DashboardRepository } from "@/src/application/ports/dashboard/dashboard-repository"

export function getDashboardOverview(repository: DashboardRepository) {
  return repository.getOverview()
}
