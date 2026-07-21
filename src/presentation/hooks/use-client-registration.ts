"use client"

import { useState } from "react"
import { RegisterClient } from "@/src/application/use-cases/partners/register-client"
import type { ClientRegistration } from "@/src/domain/partners/client-registration"
import { clientRegistrationApi } from "@/src/infrastructure/http/client-registration-api"

const registerClient = new RegisterClient(clientRegistrationApi)

export const initialClientRegistration: ClientRegistration = {
  clientType: "Pessoa juridica",
  cpf: "",
  cnpj: "",
  name: "",
  tradeName: "",
  email: "",
  primaryPhone: "",
  birthDate: "",
  rg: "",
  gender: "",
  motherName: "",
  fatherName: "",
  primaryContactName: "",
  zipCode: "",
  address: "",
  addressNumber: "",
  complement: "",
  district: "",
  state: "",
  city: "",
}

export function useClientRegistration() {
  const [client, setClient] = useState<ClientRegistration>(initialClientRegistration)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("Nao foi possivel salvar o cliente.")

  const updateClient = <Field extends keyof ClientRegistration>(
    field: Field,
    value: ClientRegistration[Field],
  ) => {
    setClient((current) => ({ ...current, [field]: value }))
  }

  const resetClient = () => {
    setClient(initialClientRegistration)
    setStatus("idle")
    setErrorMessage("Nao foi possivel salvar o cliente.")
  }

  const submitClient = async () => {
    setStatus("saving")
    setErrorMessage("Nao foi possivel salvar o cliente.")

    try {
      await registerClient.execute(client)
      setStatus("saved")
      return true
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o cliente.")
      setStatus("error")
      return false
    }
  }

  return {
    client,
    status,
    errorMessage,
    updateClient,
    resetClient,
    submitClient,
  }
}
