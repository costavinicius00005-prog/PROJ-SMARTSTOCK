import type { ClientRegistrationGateway } from "@/src/application/ports/partners/client-registration-gateway"
import type { ClientRegistration } from "@/src/domain/partners/client-registration"

export const supplierRegistrationApi: ClientRegistrationGateway = {
  async register(supplier: ClientRegistration) {
    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplier),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.message ?? "Nao foi possivel cadastrar o fornecedor.")
    }
  },
}
