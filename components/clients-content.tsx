"use client"

import { useState } from "react"
import { Search, MoreVertical, Plus, Mail, Phone } from "lucide-react"
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

const clients = [
  { id: 1, name: "MEIRE SOARES MENDONCA MORAIS LTDA", cpfCnpj: "12.345.678/0001-90", phone: "(31) 9999-8888", email: "meire@empresa.com", city: "Belo Horizonte - MG", status: "Ativo" },
  { id: 2, name: "JOAO DA SILVA ME", cpfCnpj: "98.765.432/0001-10", phone: "(11) 9888-7777", email: "joao@silva.com", city: "Sao Paulo - SP", status: "Ativo" },
  { id: 3, name: "MARIA SANTOS COMERCIO LTDA", cpfCnpj: "11.222.333/0001-44", phone: "(21) 9777-6666", email: "maria@santos.com", city: "Rio de Janeiro - RJ", status: "Ativo" },
  { id: 4, name: "CARLOS FERREIRA E CIA", cpfCnpj: "44.555.666/0001-77", phone: "(31) 9666-5555", email: "carlos@ferreira.com", city: "Contagem - MG", status: "Inativo" },
  { id: 5, name: "SMARTSTOCK MATERIAIS ESPORTIVOS", cpfCnpj: "77.888.999/0001-11", phone: "(31) 9555-4444", email: "contato@smartstock.com", city: "Betim - MG", status: "Ativo" },
  { id: 6, name: "DISTRIBUIDORA NORTE SUL LTDA", cpfCnpj: "22.333.444/0001-55", phone: "(41) 9444-3333", email: "vendas@nortesul.com", city: "Curitiba - PR", status: "Ativo" },
]

export function ClientsContent() {
  const [search, setSearch] = useState("")

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpfCnpj.includes(search)
  )

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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="size-4" />
          Novo cliente
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
              {filtered.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.cpfCnpj}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground" />
                      {client.phone}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3 text-muted-foreground" />
                      {client.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.city}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        client.status === "Ativo"
                          ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {client.status}
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
                        <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-primary/5">
            <span className="text-sm font-semibold text-foreground">
              TOTAL: <span className="font-normal">{clients.length} Clientes</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
