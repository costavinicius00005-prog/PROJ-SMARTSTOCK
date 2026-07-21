export type ClientType = "Pessoa fisica" | "Pessoa juridica"

export interface ClientRegistration {
  clientType: ClientType
  cpf: string
  cnpj: string
  name: string
  tradeName: string
  email: string
  primaryPhone: string
  birthDate: string
  rg: string
  gender: string
  motherName: string
  fatherName: string
  primaryContactName: string
  zipCode: string
  address: string
  addressNumber: string
  complement: string
  district: string
  state: string
  city: string
}
