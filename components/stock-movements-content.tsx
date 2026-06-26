"use client"

import { useState } from "react"
import { Search, Plus, ArrowUpDown, Package, ArrowUp, ArrowDown } from "lucide-react"
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
import { appUseCases } from "@/src/composition/use-cases"
import { useSearch } from "@/src/presentation/hooks/use-search"

export function StockMovementsContent() {
  const [search, setSearch] = useState("")
  const { summary, movements } = appUseCases.getStockOverview()
  const filtered = useSearch(movements, search, (movement, normalizedSearch) =>
    movement.product.toLowerCase().includes(normalizedSearch) ||
    movement.origin.toLowerCase().includes(normalizedSearch)
  )

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Estoque</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Movimentacoes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
              <Package className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Produtos</p>
              <p className="text-lg font-bold text-foreground">{summary.totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-[#22c55e]/10">
              <ArrowUp className="size-4 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entradas (mes)</p>
              <p className="text-lg font-bold text-foreground">{summary.monthlyEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10">
              <ArrowDown className="size-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saidas (mes)</p>
              <p className="text-lg font-bold text-foreground">{summary.monthlyOutputs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto ou origem"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="size-4" />
          Nova movimentacao
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Movimentacoes de estoque</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-foreground font-medium">Data</TableHead>
                <TableHead className="text-foreground font-medium">Produto</TableHead>
                <TableHead className="text-foreground font-medium">Tipo</TableHead>
                <TableHead className="text-foreground font-medium">Quantidade</TableHead>
                <TableHead className="text-foreground font-medium">Origem</TableHead>
                <TableHead className="text-foreground font-medium">Estoque Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((movement) => (
                <TableRow key={movement.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm text-muted-foreground">{movement.date}</TableCell>
                  <TableCell className="text-sm text-foreground">{movement.product}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        movement.type === "Entrada"
                          ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }
                    >
                      <ArrowUpDown className="size-3 mr-1" />
                      {movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-sm font-medium ${
                    movement.type === "Entrada" ? "text-[#22c55e]" : "text-destructive"
                  }`}>
                    {movement.quantity}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{movement.origin}</TableCell>
                  <TableCell className="text-sm text-foreground font-medium">{movement.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
