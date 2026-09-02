"use client"

import { FormEvent } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ClientType } from "@/src/domain/partners/client-registration"
import { useClientRegistration } from "@/src/presentation/hooks/use-client-registration"

const sections = ["Dados gerais", "Dados adicionais", "Endereco"]
const clientTypes: ClientType[] = ["Pessoa juridica", "Pessoa fisica"]

type PartnerKind = "client" | "supplier"

export function ClientRegistrationContent({ partnerKind = "client" }: { partnerKind?: PartnerKind }) {
  const isSupplier = partnerKind === "supplier"
  const partnerLabel = isSupplier ? "fornecedor" : "cliente"
  const listHref = isSupplier ? "/cadastros/fornecedores" : "/cadastros/clientes"
  const { client, status, errorMessage, updateClient, resetClient, submitClient } = useClientRegistration(partnerKind)
  const isIndividual = client.clientType === "Pessoa fisica"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitClient()
  }

  const handleSaveAndAddAnother = async () => {
    const saved = await submitClient()

    if (saved) {
      resetClient()
    }
  }

  return (
    <div className="min-h-full bg-[#eef1f6] p-4 md:p-6">
      <div className="mx-auto grid max-w-[1580px] gap-5 lg:grid-cols-[312px_1fr]">
        <aside className="self-start rounded-md border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground">Novo {partnerLabel}</h1>
          </div>

          <nav className="px-3 py-3">
            {sections.map((section, index) => (
              <a
                key={section}
                href={`#${section.toLowerCase().replaceAll(" ", "-")}`}
                className={[
                  "flex h-11 items-center justify-between px-3 text-sm font-medium transition-colors",
                  index === 0
                    ? "bg-[#a9c8f7] text-[#17324d]"
                    : "text-[#17324d] hover:bg-muted",
                ].join(" ")}
              >
                <span>{section}</span>
                {index === 0 ? <ChevronRight className="size-5" /> : null}
              </a>
            ))}
          </nav>

          <div className="grid gap-3 px-3 pb-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-sm"
              onClick={handleSaveAndAddAnother}
              disabled={status === "saving"}
            >
              Salvar e adicionar outro
            </Button>
            <Button
              type="submit"
              form="client-registration-form"
              className="h-11 rounded-sm bg-[#22b889] text-white hover:bg-[#1da77c]"
              disabled={status === "saving"}
            >
              {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : `Salvar ${partnerLabel}`}
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-sm">
              <Link href={listHref}>Voltar para a lista</Link>
            </Button>
          </div>
        </aside>

        <form id="client-registration-form" onSubmit={handleSubmit} className="grid gap-6">
          <Card id="dados-gerais" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">
                Dados gerais do {partnerLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr]">
                <Field label={`Tipo do ${partnerLabel}`}>
                  <Select
                    value={client.clientType}
                    onValueChange={(value) => updateClient("clientType", value as ClientType)}
                  >
                    <SelectTrigger className="h-11 w-full rounded-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={isIndividual ? "CPF" : "CNPJ"}>
                  <Input
                    value={isIndividual ? client.cpf : client.cnpj}
                    onChange={(event) =>
                      updateClient(isIndividual ? "cpf" : "cnpj", event.target.value)
                    }
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              </div>

              <Field label={`Nome do ${partnerLabel}`} required>
                <Input
                  value={client.name}
                  onChange={(event) => updateClient("name", event.target.value)}
                  required
                  className="h-11 rounded-sm bg-white"
                />
              </Field>

              {!isIndividual ? (
                <Field label="Nome fantasia">
                  <Input
                    value={client.tradeName}
                    onChange={(event) => updateClient("tradeName", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              ) : null}
            </CardContent>
          </Card>

          <Card id="dados-adicionais" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">Dados adicionais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="E-mail">
                <Input
                  type="email"
                  value={client.email}
                  onChange={(event) => updateClient("email", event.target.value)}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>
              <Field label="Telefone principal">
                <Input
                  value={client.primaryPhone}
                  onChange={(event) => updateClient("primaryPhone", event.target.value)}
                  className="h-11 rounded-sm bg-white"
                />
              </Field>

              {isIndividual ? (
                <>
                  <Field label="Data de nascimento">
                    <Input
                      type="date"
                      value={client.birthDate}
                      onChange={(event) => updateClient("birthDate", event.target.value)}
                      className="h-11 rounded-sm bg-white"
                    />
                  </Field>
                  <Field label="RG">
                    <Input
                      value={client.rg}
                      onChange={(event) => updateClient("rg", event.target.value)}
                      className="h-11 rounded-sm bg-white"
                    />
                  </Field>
                  <Field label="Sexo">
                    <Input
                      value={client.gender}
                      onChange={(event) => updateClient("gender", event.target.value)}
                      className="h-11 rounded-sm bg-white"
                    />
                  </Field>
                  <Field label="Nome da mae">
                    <Input
                      value={client.motherName}
                      onChange={(event) => updateClient("motherName", event.target.value)}
                      className="h-11 rounded-sm bg-white"
                    />
                  </Field>
                  <Field label="Nome do pai">
                    <Input
                      value={client.fatherName}
                      onChange={(event) => updateClient("fatherName", event.target.value)}
                      className="h-11 rounded-sm bg-white"
                    />
                  </Field>
                </>
              ) : (
                <Field label="Nome do contato principal">
                  <Input
                    value={client.primaryContactName}
                    onChange={(event) => updateClient("primaryContactName", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              )}
            </CardContent>
          </Card>

          <Card id="endereco" className="rounded-md border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-[#17324d]">Endereco</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-[180px_1fr_160px]">
                <Field label="CEP">
                  <Input
                    value={client.zipCode}
                    onChange={(event) => updateClient("zipCode", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
                <Field label="Endereco">
                  <Input
                    value={client.address}
                    onChange={(event) => updateClient("address", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
                <Field label="Numero">
                  <Input
                    value={client.addressNumber}
                    onChange={(event) => updateClient("addressNumber", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Complemento">
                  <Input
                    value={client.complement}
                    onChange={(event) => updateClient("complement", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
                <Field label="Bairro">
                  <Input
                    value={client.district}
                    onChange={(event) => updateClient("district", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                <Field label="Estado">
                  <Input
                    value={client.state}
                    onChange={(event) => updateClient("state", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
                <Field label="Cidade">
                  <Input
                    value={client.city}
                    onChange={(event) => updateClient("city", event.target.value)}
                    className="h-11 rounded-sm bg-white"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {status === "saved" ? (
            <p className="rounded-sm border border-[#22b889]/40 bg-[#22b889]/10 px-3 py-2 text-sm font-medium text-[#137557]">
              {isSupplier ? "Fornecedor salvo com sucesso." : "Cliente salvo com sucesso."}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#17324d]">
      <span>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  )
}
