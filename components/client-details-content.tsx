"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"

type HistoryKind = "VENDA" | "PEDIDO" | "ORCAMENTO"

type HistoryEntry = {
  kind: HistoryKind
  id: string
  number: number
  date: string
  status: string
  total: number
}

const kindLabels: Record<HistoryKind, string> = {
  VENDA: "Venda (caixa)",
  PEDIDO: "Pedido de venda",
  ORCAMENTO: "Orcamento",
}

const statusLabels: Record<string, string> = {
  COMPLETED: "Concluida",
  DRAFT: "Rascunho",
  OPEN: "Em aberto",
  CONFIRMED: "Confirmado",
  FULFILLED: "Atendido",
  CONVERTED: "Convertido",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
}

const money = (value: number | null | undefined) =>
  Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const date = (value: string) => new Date(value).toLocaleDateString("pt-BR")

function historyHref(entry: HistoryEntry) {
  if (entry.kind === "PEDIDO") return `/vendas/pedidos/${entry.id}`
  if (entry.kind === "ORCAMENTO") return `/vendas/orcamentos/${entry.id}`
  return null
}

export function ClientDetailsContent({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<RegisteredClient | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")

  useEffect(() => {
    const load = async () => {
      setStatus("loading")
      try {
        const [clientResponse, historyResponse] = await Promise.all([
          fetch(`/api/clients/${clientId}`, { cache: "no-store" }),
          fetch(`/api/clients/${clientId}/history`, { cache: "no-store" }),
        ])
        if (!clientResponse.ok || !historyResponse.ok) throw new Error()
        setClient((await clientResponse.json()) as RegisteredClient)
        setHistory((await historyResponse.json()) as HistoryEntry[])
        setStatus("loaded")
      } catch {
        setStatus("error")
      }
    }

    load()
  }, [clientId])

  // So vendas efetivadas contam como compra: um pedido atendido vira uma venda, entao somar
  // pedidos e vendas contaria a mesma compra duas vezes. Orcamentos nunca contam.
  const summary = useMemo(() => {
    const purchases = history.filter((entry) => entry.kind === "VENDA" && entry.status !== "CANCELLED")
    return {
      count: purchases.length,
      total: purchases.reduce((sum, entry) => sum + Number(entry.total), 0),
      last: purchases[0]?.date ?? null,
    }
  }, [history])

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status === "error" || !client) {
    return (
      <div className="p-6">
        <p className="mb-3 text-sm text-destructive">Nao foi possivel carregar o cliente.</p>
        <Button asChild variant="outline">
          <Link href="/cadastros/clientes">Voltar para a lista</Link>
        </Button>
      </div>
    )
  }

  const isIndividual = client.clientType === "Pessoa fisica"
  const address = [
    [client.address, client.addressNumber].filter(Boolean).join(", "),
    client.complement,
    client.district,
    [client.city, client.state].filter(Boolean).join(" - "),
    client.zipCode ? `CEP ${client.zipCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/cadastros/clientes" className="hover:text-foreground">Clientes</Link>
        <span>{">"}</span>
        <span className="font-medium text-foreground">{client.name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client.clientType}
            {client.cpf ? ` · CPF ${client.cpf}` : ""}
            {client.cnpj ? ` · CNPJ ${client.cnpj}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/cadastros/clientes">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Voltar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/cadastros/clientes/${client.id}/editar`}>
              <Pencil className="mr-1.5 size-3.5" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Limite de credito" value={client.creditLimit != null ? money(client.creditLimit) : "Sem limite definido"} />
        <SummaryCard label="Total comprado" value={money(summary.total)} />
        <SummaryCard label="Compras realizadas" value={String(summary.count)} />
        <SummaryCard label="Ultima compra" value={summary.last ? date(summary.last) : "-"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {!isIndividual ? <Info label="Nome fantasia" value={client.tradeName} /> : null}
            <Info label="E-mail" value={client.email} />
            <Info label="Telefone" value={client.primaryPhone} />
            {isIndividual ? (
              <>
                <Info label="Data de nascimento" value={client.birthDate ? date(`${client.birthDate}T00:00:00`) : null} />
                <Info label="RG" value={client.rg} />
                <Info label="Sexo" value={client.gender} />
                <Info label="Nome da mae" value={client.motherName} />
                <Info label="Nome do pai" value={client.fatherName} />
              </>
            ) : (
              <Info label="Contato principal" value={client.primaryContactName} />
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <Info label="Endereco" value={address || null} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card id="historico" className="scroll-mt-4">
        <CardHeader>
          <CardTitle className="text-base">Historico de compras</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="pl-4">Tipo</TableHead>
                <TableHead>Numero</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    Este cliente ainda nao possui vendas, pedidos ou orcamentos.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => {
                  const href = historyHref(entry)
                  return (
                    <TableRow key={`${entry.kind}-${entry.id}`}>
                      <TableCell className="pl-4 text-sm">{kindLabels[entry.kind]}</TableCell>
                      <TableCell className="text-sm">
                        {href ? (
                          <Link href={href} className="text-primary hover:underline">#{entry.number}</Link>
                        ) : (
                          `#${entry.number}`
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{date(entry.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{statusLabels[entry.status] ?? entry.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right text-sm">{money(entry.total)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
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
