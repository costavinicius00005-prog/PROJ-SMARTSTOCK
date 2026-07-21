"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Search, MoreVertical, Plus, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { entityStatusClassName } from "@/src/presentation/formatters/status-styles"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"

export function ClientsContent() {
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<RegisteredClient[]>([])
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  useEffect(() => {
    const loadClients = async () => {
      setStatus("loading")

      try {
        const response = await fetch("/api/clients", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Nao foi possivel listar os clientes.")
        }

        const data = (await response.json()) as RegisteredClient[]
        setClients(data)
        setStatus("loaded")
      } catch {
        setStatus("error")
      }
    }

    loadClients()
  }, [])

  const deleteClient = async (client: RegisteredClient) => {
    const canDelete = window.confirm(`Excluir o cliente "${client.name}"?`)

    if (!canDelete) {
      return
    }

    setDeletingClientId(client.id)

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o cliente.")
      }

      setClients((currentClients) =>
        currentClients.filter((currentClient) => currentClient.id !== client.id),
      )
    } catch {
      setStatus("error")
    } finally {
      setDeletingClientId(null)
    }
  }

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return clients
    }

    return clients.filter((client) =>
      [client.name, client.cpf, client.cnpj, client.email, client.primaryPhone, client.city]
        .some((value) => (value ?? "").toLowerCase().includes(normalizedSearch)),
    )
  }, [clients, search])

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Cadastros</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Clientes</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF/CNPJ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Link href="/cadastros/clientes/novo">
            <Plus className="size-4" />
            Novo cliente
          </Link>
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Clientes cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-foreground font-medium">Nome</TableHead>
                <TableHead className="text-foreground font-medium">CPF/CNPJ</TableHead>
                <TableHead className="text-foreground font-medium">Telefone</TableHead>
                <TableHead className="text-foreground font-medium">E-mail</TableHead>
                <TableHead className="text-foreground font-medium">Cidade</TableHead>
                <TableHead className="text-foreground font-medium">Situacao</TableHead>
                <TableHead className="text-center text-foreground font-medium">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status === "loading" ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    Carregando clientes...
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "error" ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-destructive">
                    Nao foi possivel carregar os clientes.
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "loaded" && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "loaded" && filtered.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.cpf ?? client.cnpj ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground" />
                      {client.primaryPhone ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-muted-foreground" />
                      {client.email ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[client.city, client.state].filter(Boolean).join(" - ") || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={entityStatusClassName("Ativo")}
                    >
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Historico de compras</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={deletingClientId === client.id}
                          onClick={() => deleteClient(client)}
                        >
                          {deletingClientId === client.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-primary/5">
            <span className="text-sm font-semibold text-foreground">
              TOTAL: <span className="font-normal">{filtered.length} Clientes</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
