import type { PartyRepository } from "@/src/application/ports/partners/party-repository"
import { clients, suppliers } from "@/src/infrastructure/mock-data/partners/parties"

export const inMemoryPartyRepository: PartyRepository = {
  listClients: () => clients,
  listSuppliers: () => suppliers,
}
