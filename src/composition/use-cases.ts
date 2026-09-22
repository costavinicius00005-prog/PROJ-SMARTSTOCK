import { listNavigationMenu } from "@/src/application/use-cases/navigation/list-navigation-menu"
import { inMemoryNavigationRepository } from "@/src/infrastructure/repositories/in-memory-navigation-repository"

// Composicao de casos de uso.
// As telas de negocio buscam dados reais diretamente da API REST (mesmo banco
// de dados do ERP). Aqui permanece somente o menu de navegacao, que e estatico.
export const appUseCases = {
  listNavigationMenu: () => listNavigationMenu(inMemoryNavigationRepository),
}
