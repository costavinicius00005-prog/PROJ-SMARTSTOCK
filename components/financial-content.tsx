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
import { appUseCases } from "@/src/composition/use-cases"
import { financialStatusClassName } from "@/src/presentation/formatters/status-styles"
import { useSearch } from "@/src/presentation/hooks/use-search"

export function FinancialContent() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pagar")
  const { summary, payables, receivables } = appUseCases.getFinancialOverview()
  const filteredPayables = useSearch(payables, search, (account, normalizedSearch) =>
    account.description.toLowerCase().includes(normalizedSearch) ||
    account.supplier.toLowerCase().includes(normalizedSearch)
  )
  const filteredReceivables = useSearch(receivables, search, (account, normalizedSearch) =>
    account.description.toLowerCase().includes(normalizedSearch) ||
    account.client.toLowerCase().includes(normalizedSearch)
  )

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
            <p className="text-lg font-bold text-foreground">{summary.totalReceivable}</p>
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
            <p className="text-lg font-bold text-foreground">{summary.totalPayable}</p>
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
            <p className="text-lg font-bold text-foreground">{summary.overdue}</p>
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
            <p className="text-lg font-bold text-[#22c55e]">{summary.expectedBalance}</p>
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
                  {filteredPayables.map((conta) => (
                      <TableRow key={conta.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 text-sm text-foreground">{conta.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.supplier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.dueDate}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {conta.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={financialStatusClassName(conta.status)}>
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
                  {filteredReceivables.map((conta) => (
                      <TableRow key={conta.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 text-sm text-foreground">{conta.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.client}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conta.dueDate}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {conta.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={financialStatusClassName(conta.status)}>
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
