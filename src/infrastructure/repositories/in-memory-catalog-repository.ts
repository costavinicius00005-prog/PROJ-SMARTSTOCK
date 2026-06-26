import type { ProductRepository } from "@/src/application/ports/catalog/product-repository"
import { products } from "@/src/infrastructure/mock-data/catalog/products"

export const inMemoryCatalogRepository: ProductRepository = {
  list: () => products,
}
