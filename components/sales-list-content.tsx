"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, MoreVertical, Plus, Filter } from "lucide-react"
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
import { appUseCases } from "@/src/composition/use-cases"
import { salesOrderStatusClassName } from "@/src/presentation/formatters/status-styles"
import { useSearch } from "@/src/presentation/hooks/use-search"

export function SalesListContent() {
  const [search, setSearch] = useState("")
  const orders = appUseCases.listSalesOrders()
  const filtered = useSearch(orders, search, (order, normalizedSearch) =>
    order.client.toLowerCase().includes(normalizedSearch) ||
    order.number.includes(normalizedSearch)
  )

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Vendas</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Pedidos de venda</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou numero"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-sm">
            <Filter className="size-3.5" />
            Filtros
          </Button>
        </div>
        <Link href="/vendas/orcamentos">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="size-4" />
            Novo pedido de venda
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Pedidos de venda</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-foreground font-medium">Numero</TableHead>
                <TableHead className="text-foreground font-medium">Data</TableHead>
                <TableHead className="text-foreground font-medium">Cliente</TableHead>
                <TableHead className="text-right text-foreground font-medium">Valor total</TableHead>
                <TableHead className="text-foreground font-medium">Status</TableHead>
                <TableHead className="text-center text-foreground font-medium">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm font-medium text-foreground">
                    #{order.number}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                  <TableCell className="text-sm text-foreground">{order.client}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-foreground">
                    {order.total}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={salesOrderStatusClassName(order.status)}>
                      {order.status}
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
                        <DropdownMenuItem>Faturar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Imprimir</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancelar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
