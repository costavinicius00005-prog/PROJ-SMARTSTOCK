import type { ClientRegistrationGateway } from "@/src/application/ports/partners/client-registration-gateway"
import type { ClientRegistration } from "@/src/domain/partners/client-registration"

export class RegisterClient {
  constructor(
    private readonly gateway: ClientRegistrationGateway,
    private readonly partnerLabel = "cliente",
  ) {}

  async execute(client: ClientRegistration) {
    if (!client.name.trim()) {
      throw new Error(`Nome do ${this.partnerLabel} e obrigatorio.`)
    }

    await this.gateway.register(client)
  }
}
