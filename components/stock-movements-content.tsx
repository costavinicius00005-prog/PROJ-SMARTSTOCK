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

const movements = [
  { id: 1, date: "03/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+10 PAR", origin: "NF 257 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "11 PAR" },
  { id: 2, date: "03/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+5 PAR", origin: "NF 256 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "1 PAR" },
  { id: 3, date: "02/03/2026", product: "CHUTEIRA SOCIETY BRASIL 70 PRO", type: "Saida", quantity: "-2 PARES", origin: "Pedido #G2 - JOAO DA SILVA ME", stock: "1 PARES" },
  { id: 4, date: "02/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+8 PAR", origin: "NF 255 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "6 PAR" },
  { id: 5, date: "01/03/2026", product: "TENIS CORRIDA ULTRA BOOST", type: "Saida", quantity: "-3 PAR", origin: "Pedido #G6 - DISTRIBUIDORA NORTE SUL", stock: "12 PAR" },
  { id: 6, date: "01/03/2026", product: "CHUTEIRA SOCIETY BRASIL 70 PRO", type: "Entrada", quantity: "+5 PARES", origin: "NF 250 - CALCADOS BRASIL LTDA", stock: "3 PARES" },
]

export function StockMovementsContent() {
  const [search, setSearch] = useState("")

  const filtered = movements.filter((m) =>
    m.product.toLowerCase().includes(search.toLowerCase()) ||
    m.origin.toLowerCase().includes(search.toLowerCase())
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
              <p className="text-lg font-bold text-foreground">38.310</p>
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
              <p className="text-lg font-bold text-foreground">156</p>
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
              <p className="text-lg font-bold text-foreground">89</p>
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
