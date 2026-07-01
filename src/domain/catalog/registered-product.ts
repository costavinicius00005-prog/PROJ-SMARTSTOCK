import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export interface RegisteredProduct extends ProductRegistration {
  id: string
  category: string
  brand: string
  unitOfMeasure: string
}
