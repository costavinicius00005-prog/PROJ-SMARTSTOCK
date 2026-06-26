import type { NavigationRepository } from "@/src/application/ports/navigation/navigation-repository"
import { navigationMenu } from "@/src/infrastructure/mock-data/navigation/menu"

export const inMemoryNavigationRepository: NavigationRepository = {
  listMenuItems: () => navigationMenu,
}
