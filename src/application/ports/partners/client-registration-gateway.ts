import type { ClientRegistration } from "@/src/domain/partners/client-registration"

export interface ClientRegistrationGateway {
  register(client: ClientRegistration): Promise<void>
}
