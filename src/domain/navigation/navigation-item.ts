export type NavigationIconKey =
  | "layout-dashboard"
  | "users"
  | "shopping-cart"
  | "truck"
  | "bar-chart-3"
  | "dollar-sign"
  | "wallet"
  | "file-text"
  | "building-2"
  | "settings"
  | "package"
  | "store"

export interface NavigationChild {
  title: string
  href: string
}

export interface NavigationItem {
  title: string
  icon: NavigationIconKey
  href?: string
  badge?: string
  children?: NavigationChild[]
}
