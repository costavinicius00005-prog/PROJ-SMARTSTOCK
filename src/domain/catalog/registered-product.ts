import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export interface RegisteredProduct extends ProductRegistration {
  id: string
}
