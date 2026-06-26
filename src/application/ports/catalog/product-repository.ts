import type { Product } from "@/src/domain/catalog/product"

export interface ProductRepository {
  list(): Product[]
}
