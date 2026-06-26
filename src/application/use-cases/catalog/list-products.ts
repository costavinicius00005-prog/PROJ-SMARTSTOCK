import type { ProductRepository } from "@/src/application/ports/catalog/product-repository"

export function listProducts(repository: ProductRepository) {
  return repository.list()
}
