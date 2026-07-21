import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export interface RegisteredProduct
  extends Omit<ProductRegistration, "costValue" | "saleMarkup" | "salePrice"> {
  id: string
  category: string
  brand: string
  unitOfMeasure: string
  costValue: number
  saleMarkup: number
  salePrice: number
}
