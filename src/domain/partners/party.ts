import type { EntityStatus } from "@/src/domain/shared/status"

export interface Party {
  id: number
  name: string
  cpfCnpj: string
  phone: string
  email: string
  city: string
  status: EntityStatus
}
