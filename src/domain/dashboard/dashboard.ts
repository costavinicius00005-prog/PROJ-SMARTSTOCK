import type { TrendDirection } from "@/src/domain/shared/status"

export type DashboardIconKey =
  | "users"
  | "shopping-cart"
  | "package"
  | "wallet"
  | "file-text"
  | "dollar-sign"
  | "trending-up"

export interface QuickAccessLink {
  title: string
  href: string
}

export interface QuickAccessSection {
  category: string
  icon: DashboardIconKey
  links: QuickAccessLink[]
}

export interface KpiCard {
  title: string
  value: string
  change: string
  trend: TrendDirection
  icon: DashboardIconKey
}

export interface SalesChartPoint {
  label: string
  height: number
}

export interface FinancialOverviewItem {
  label: string
  value: string
  tone: "success" | "danger" | "primary"
}

export interface DashboardOverview {
  quickAccessItems: QuickAccessSection[]
  kpis: KpiCard[]
  salesLastSevenDays: SalesChartPoint[]
  financialOverview: FinancialOverviewItem[]
}
