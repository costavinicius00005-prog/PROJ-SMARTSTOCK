import type { ProductRegistrationGateway } from "@/src/application/ports/catalog/product-registration-gateway"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"

export const productRegistrationApi: ProductRegistrationGateway = {
  async register(product: ProductRegistration) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    })

    if (!response.ok) {
      throw new Error("Nao foi possivel cadastrar o produto.")
    }
  },

  async update(productId: string, product: ProductRegistration) {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    })

    if (!response.ok) {
      throw new Error("Nao foi possivel atualizar o produto.")
    }
  },
}
