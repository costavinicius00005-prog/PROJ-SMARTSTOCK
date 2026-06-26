import type { PartyRepository } from "@/src/application/ports/partners/party-repository"

export function listSuppliers(repository: PartyRepository) {
  return repository.listSuppliers()
}
