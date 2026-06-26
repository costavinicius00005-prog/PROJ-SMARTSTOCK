import type { NavigationItem } from "@/src/domain/navigation/navigation-item"

export interface NavigationRepository {
  listMenuItems(): NavigationItem[]
}
