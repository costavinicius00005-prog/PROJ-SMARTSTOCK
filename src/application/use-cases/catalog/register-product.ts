import type { ProductRegistrationGateway } from "@/src/application/ports/catalog/product-registration-gateway"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export class RegisterProduct {
  constructor(private readonly productRegistrationGateway: ProductRegistrationGateway) {}

  execute(product: ProductRegistration) {
    return this.productRegistrationGateway.register(product)
  }
}
