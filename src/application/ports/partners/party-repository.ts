import type { Party } from "@/src/domain/partners/party"

export interface PartyRepository {
  listClients(): Party[]
  listSuppliers(): Party[]
}
