"use client"

import { useState } from "react"
import {
  Search,
  MoreVertical,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const contasPagar = [
  {
    id: 1,
    description: "Aluguel do espaco comercial",
    supplier: "Imobiliaria Centro Sul",
    dueDate: "05/03/2026",
    value: "R$ 4.500,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 2,
    description: "Fornecedor - Calcados Esportivos",
    supplier: "MEIRE SOARES MENDONCA MORAIS LTDA",
    dueDate: "10/03/2026",
    value: "R$ 12.340,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 3,
    description: "Energia eletrica",
    supplier: "CEMIG",
    dueDate: "15/03/2026",
    value: "R$ 890,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 4,
    description: "Internet empresarial",
    supplier: "Vivo Empresas",
    dueDate: "20/03/2026",
    value: "R$ 299,90",
    status: "Pago",
    statusColor: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
  },
  {
    id: 5,
    description: "Fornecedor - Roupas Fitness",
    supplier: "Distribuidora Norte Sul",
    dueDate: "01/03/2026",
    value: "R$ 8.750,00",
    status: "Vencido",
    statusColor: "bg-destructive/10 text-destructive border-destructive/30",
  },
]

const contasReceber = [
  {
    id: 1,
    description: "Pedido #G2 - Venda",
    client: "JOAO DA SILVA ME",
    dueDate: "10/03/2026",
    value: "R$ 3.890,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 2,
    description: "Pedido #G4 - Venda",
    client: "CARLOS FERREIRA E CIA",
    dueDate: "15/03/2026",
    value: "R$ 2.100,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 3,
    description: "Pedido #G6 - Venda",
    client: "DISTRIBUIDORA NORTE SUL LTDA",
    dueDate: "05/03/2026",
    value: "R$ 8.750,00",
    status: "Recebido",
    statusColor: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
  },
  {
    id: 4,
    description: "Pedido #G7 - Venda",
    client: "LOJA DO ESPORTE EIRELI",
    dueDate: "20/03/2026",
    value: "R$ 1.960,00",
    status: "Pendente",
    statusColor: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
  },
  {
    id: 5,
    description: "Mensalidade - Cartao",
    client: "Cartoes diversos",
    dueDate: "28/02/2026",
    value: "R$ 15.430,00",
    status: "Vencido",
    statusColor: "bg-destructive/10 text-destructive border-destructive/30",
  },
]

export function FinancialContent() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pagar")

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Financeiro</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Visao geral</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-[#22c55e]/10">
                <ArrowUpRight className="size-4 text-[#22c55e]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total a Receber</p>
            <p className="text-lg font-bold text-foreground">R$ 32.130,00</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10">
                <ArrowDownRight className="size-4 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
            <p className="text-lg font-bold text-foreground">R$ 26.779,90</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-[#f59e0b]/10">
                <AlertCircle className="size-4 text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Contas Vencidas</p>
            <p className="text-lg font-bold text-foreground">R$ 24.180,00</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                <DollarSign className="size-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Saldo Previsto</p>
            <p className="text-lg font-bold text-[#22c55e]">R$ 5.350,10</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="pagar" className="gap-1.5">
              <ArrowDownRight className="size-3.5" />
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-1.5">
              <ArrowUpRight className="size-3.5" />
              Contas a Receber
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-sm">
              <Filter className="size-3.5" />
              Filtros
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="size-4" />
              {activeTab === "pagar" ? "Nova conta a pagar" : "Nova conta a receber"}
            </Button>
          </div>
        </div>

        <TabsContent value="pagar">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-foreground font-medium">Descricao</TableHead>
                    <TableHead className="text-foreground font-medium">Fornecedor</TableHead>
                    <TableHead className="text-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        Vencimento
                      </span>
                    </TableHead>
                    <TableHead className="text-right text-foreground font-medium">Valor</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-center text-foreground font-medium">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagar
                    .filter(
                      (c) =>
                        c.description.toLowerCase().includes(search.toLowerCase()) ||
                        c.supplier.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((conta) => (
                      <TableRow key={conta.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 text-sm text-foreground">{conta.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.supplier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.dueDate}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {conta.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={conta.statusColor}>
                            {conta.status}
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
                              <DropdownMenuItem>
                                <CheckCircle2 className="size-3.5 mr-2" />
                                Dar baixa
                              </DropdownMenuItem>
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receber">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-foreground font-medium">Descricao</TableHead>
                    <TableHead className="text-foreground font-medium">Cliente</TableHead>
                    <TableHead className="text-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        Vencimento
                      </span>
                    </TableHead>
                    <TableHead className="text-right text-foreground font-medium">Valor</TableHead>
                    <TableHead className="text-foreground font-medium">Status</TableHead>
                    <TableHead className="text-center text-foreground font-medium">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasReceber
                    .filter(
                      (c) =>
                        c.description.toLowerCase().includes(search.toLowerCase()) ||
                        c.client.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((conta) => (
                      <TableRow key={conta.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 text-sm text-foreground">{conta.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.client}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.dueDate}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {conta.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={conta.statusColor}>
                            {conta.status}
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
                              <DropdownMenuItem>
                                <CheckCircle2 className="size-3.5 mr-2" />
                                Dar baixa
                              </DropdownMenuItem>
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
