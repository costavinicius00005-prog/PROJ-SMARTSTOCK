import type { ClientType } from "@/src/domain/partners/client-registration"

export interface RegisteredClient {
  id: string
  clientType: ClientType
  cpf: string | null
  cnpj: string | null
  name: string
  tradeName: string | null
  email: string | null
  primaryPhone: string | null
  birthDate: string | null
  rg: string | null
  gender: string | null
  motherName: string | null
  fatherName: string | null
  primaryContactName: string | null
  zipCode: string | null
  address: string | null
  addressNumber: string | null
  complement: string | null
  district: string | null
  state: string | null
  city: string | null
}
