"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClientRegistrationContent } from "@/components/client-registration-content"
import type { ClientRegistration } from "@/src/domain/partners/client-registration"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"

type LoadStatus = "loading" | "loaded" | "error"

function toRegistration(data: RegisteredClient): ClientRegistration {
  return {
    clientType: data.clientType ?? "Pessoa juridica",
    cpf: data.cpf ?? "",
    cnpj: data.cnpj ?? "",
    name: data.name ?? "",
    tradeName: data.tradeName ?? "",
    email: data.email ?? "",
    primaryPhone: data.primaryPhone ?? "",
    birthDate: data.birthDate ?? "",
    rg: data.rg ?? "",
    gender: data.gender ?? "",
    motherName: data.motherName ?? "",
    fatherName: data.fatherName ?? "",
    primaryContactName: data.primaryContactName ?? "",
    zipCode: data.zipCode ?? "",
    address: data.address ?? "",
    addressNumber: data.addressNumber ?? "",
    complement: data.complement ?? "",
    district: data.district ?? "",
    state: data.state ?? "",
    city: data.city ?? "",
    creditLimit: data.creditLimit ?? "",
  }
}

/** Carrega um cliente ou fornecedor e abre o formulario compartilhado em modo de edicao. */
export function ClientEditContent({
  clientId,
  partnerKind = "client",
}: {
  clientId: string
  partnerKind?: "client" | "supplier"
}) {
  const [client, setClient] = useState<ClientRegistration | null>(null)
  const [status, setStatus] = useState<LoadStatus>("loading")
  const isSupplier = partnerKind === "supplier"
  const label = isSupplier ? "fornecedor" : "cliente"
  const apiPath = isSupplier ? "/api/suppliers" : "/api/clients"
  const listHref = isSupplier ? "/cadastros/fornecedores" : "/cadastros/clientes"

  useEffect(() => {
    const load = async () => {
      setStatus("loading")
      try {
        const response = await fetch(`${apiPath}/${clientId}`, { cache: "no-store" })
        if (!response.ok) throw new Error()
        setClient(toRegistration((await response.json()) as RegisteredClient))
        setStatus("loaded")
      } catch {
        setStatus("error")
      }
    }

    load()
  }, [apiPath, clientId])

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#eef1f6] p-6 text-sm text-muted-foreground">
        Carregando {label}...
      </div>
    )
  }

  if (status === "error" || !client) {
    return (
      <div className="grid min-h-full place-items-center bg-[#eef1f6] p-6">
        <div className="grid gap-3 rounded-md border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-destructive">Nao foi possivel carregar o {label}.</p>
          <Button asChild variant="outline" className="rounded-sm">
            <Link href={listHref}>Voltar para a lista</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ClientRegistrationContent
      key={clientId}
      partnerKind={partnerKind}
      initialValue={client}
      clientId={clientId}
    />
  )
}
