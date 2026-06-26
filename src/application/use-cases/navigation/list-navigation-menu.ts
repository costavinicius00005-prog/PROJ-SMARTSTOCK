import type { NavigationRepository } from "@/src/application/ports/navigation/navigation-repository"

export function listNavigationMenu(repository: NavigationRepository) {
  return repository.listMenuItems()
}
