"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RegisteredSupplier } from "@/src/domain/partners/registered-supplier"

const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR")

export function SupplierDetailsContent({ supplierId }: { supplierId: string }) {
  const [supplier, setSupplier] = useState<RegisteredSupplier | null>(null)
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")

  useEffect(() => {
    const load = async () => {
      setStatus("loading")
      try {
        const response = await fetch(`/api/suppliers/${supplierId}`, { cache: "no-store" })
        if (!response.ok) throw new Error()
        setSupplier((await response.json()) as RegisteredSupplier)
        setStatus("loaded")
      } catch {
        setStatus("error")
      }
    }

    load()
  }, [supplierId])

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "error" || !supplier) {
    return (
      <div className="p-6">
        <p className="mb-3 text-sm text-destructive">Nao foi possivel carregar o fornecedor.</p>
        <Button asChild variant="outline">
          <Link href="/cadastros/fornecedores">Voltar para a lista</Link>
        </Button>
      </div>
    )
  }

  const isIndividual = supplier.clientType === "Pessoa fisica"
  const address = [
    [supplier.address, supplier.addressNumber].filter(Boolean).join(", "),
    supplier.complement,
    supplier.district,
    [supplier.city, supplier.state].filter(Boolean).join(" - "),
    supplier.zipCode ? `CEP ${supplier.zipCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/cadastros/fornecedores" className="hover:text-foreground">Fornecedores</Link>
        <span>{">"}</span>
        <span className="font-medium text-foreground">{supplier.name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {supplier.clientType}
            {supplier.cpf ? ` · CPF ${supplier.cpf}` : ""}
            {supplier.cnpj ? ` · CNPJ ${supplier.cnpj}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/cadastros/fornecedores">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Voltar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/cadastros/fornecedores/${supplier.id}/editar`}>
              <Pencil className="mr-1.5 size-3.5" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {!isIndividual ? <Info label="Nome fantasia" value={supplier.tradeName} /> : null}
            <Info label="E-mail" value={supplier.email} />
            <Info label="Telefone" value={supplier.primaryPhone} />
            {isIndividual ? (
              <>
                <Info label="Data de nascimento" value={supplier.birthDate ? date(supplier.birthDate) : null} />
                <Info label="RG" value={supplier.rg} />
                <Info label="Sexo" value={supplier.gender} />
                <Info label="Nome da mae" value={supplier.motherName} />
                <Info label="Nome do pai" value={supplier.fatherName} />
              </>
            ) : (
              <Info label="Contato principal" value={supplier.primaryContactName} />
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <Info label="Endereco" value={address || null} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value || "-"}</dd>
    </div>
  )
}
