import type { PartyRepository } from "@/src/application/ports/partners/party-repository"

export function listClients(repository: PartyRepository) {
  return repository.listClients()
}
