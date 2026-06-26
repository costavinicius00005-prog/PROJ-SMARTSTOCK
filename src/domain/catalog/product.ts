import type { EntityStatus } from "@/src/domain/shared/status"

export interface Product {
  id: number
  name: string
  type: string
  code: string
  ref: string
  stock: string
  price: string
  status: EntityStatus
}
