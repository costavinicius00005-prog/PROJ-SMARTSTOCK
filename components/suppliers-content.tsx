"use client"

import { useState } from "react"
import { Search, MoreVertical, Plus, Phone, Mail } from "lucide-react"
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

const suppliers = [
  { id: 1, name: "MEIRE SOARES MENDONCA MORAIS LTDA", cpfCnpj: "12.345.678/0001-90", phone: "(31) 9999-8888", email: "meire@empresa.com", city: "Belo Horizonte - MG", status: "Ativo" },
  { id: 2, name: "DISTRIBUIDORA NORTE SUL LTDA", cpfCnpj: "22.333.444/0001-55", phone: "(41) 9444-3333", email: "vendas@nortesul.com", city: "Curitiba - PR", status: "Ativo" },
  { id: 3, name: "CALCADOS BRASIL LTDA", cpfCnpj: "33.444.555/0001-66", phone: "(11) 3333-2222", email: "contato@calcbrasil.com", city: "Franca - SP", status: "Ativo" },
  { id: 4, name: "ESPORTES & CIA IMPORTACAO", cpfCnpj: "55.666.777/0001-88", phone: "(21) 2222-1111", email: "import@esportescia.com", city: "Rio de Janeiro - RJ", status: "Inativo" },
]

export function SuppliersContent() {
  const [search, setSearch] = useState("")

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.cpfCnpj.includes(search)
  )

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Cadastros</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Fornecedores</span>
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
          Novo fornecedor
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Fornecedores cadastrados</CardTitle>
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
              {filtered.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm font-medium text-foreground">{supplier.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{supplier.cpfCnpj}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {supplier.phone}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" />
                      {supplier.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{supplier.city}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        supplier.status === "Ativo"
                          ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {supplier.status}
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
              TOTAL: <span className="font-normal">{suppliers.length} Fornecedores</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
