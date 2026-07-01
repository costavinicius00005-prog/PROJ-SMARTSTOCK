import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export interface ProductRegistrationGateway {
  register(product: ProductRegistration): Promise<void>

  update(productId: string, product: ProductRegistration): Promise<void>
}
