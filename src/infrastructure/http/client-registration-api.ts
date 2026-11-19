import type { ClientRegistrationGateway } from "@/src/application/ports/partners/client-registration-gateway"
import type { ClientRegistration } from "@/src/domain/partners/client-registration"

export const clientRegistrationApi: ClientRegistrationGateway = {
  async register(client: ClientRegistration) {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toClientPayload(client)),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.message ?? "Nao foi possivel cadastrar o cliente.")
    }
  },

  async update(clientId: string, client: ClientRegistration) {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toClientPayload(client)),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.message ?? "Nao foi possivel atualizar o cliente.")
    }
  },
}

function toClientPayload(client: ClientRegistration) {
  return {
    ...client,
    birthDate: client.birthDate || null,
    creditLimit: client.creditLimit === "" ? null : client.creditLimit,
  }
}
