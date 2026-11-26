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
  /** Papeis que veem o item; ausente = todos. O servidor aplica a mesma regra nas rotas. */
  roles?: string[]
}

export interface NavigationItem {
  title: string
  icon: NavigationIconKey
  href?: string
  badge?: string
  /** Papeis que veem o item; ausente = todos. */
  roles?: string[]
  children?: NavigationChild[]
}
