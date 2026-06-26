"use client"

import { useState } from "react"
import {
  Search,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  FileSpreadsheet,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const products = [
  {
    id: 1,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507183",
    ref: "27551209",
    stock: "1 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 2,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507182",
    ref: "27551207",
    stock: "2 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 3,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507181",
    ref: "27551205",
    stock: "2 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 4,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507180",
    ref: "27551201",
    stock: "2 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 5,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507179",
    ref: "27551197",
    stock: "2 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 6,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507178",
    ref: "27551195",
    stock: "2 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 7,
    name: "BOTA FEM. DE USO COMUM C/ SOLA SINT. CABEDAL TEXTI",
    type: "Simples",
    code: "507177",
    ref: "27551193",
    stock: "1 PAR",
    price: "R$ 312,00",
    status: "Ativo",
  },
  {
    id: 8,
    name: "CHUTEIRA SOCIETY BRASIL 70 PRO Y-1 PT-DR-BC T 44",
    type: "Simples",
    code: "507176",
    ref: "242317904144",
    stock: "1 PARES",
    price: "R$ 410,00",
    status: "Ativo",
  },
]

export function ProductsContent() {
  const [search, setSearch] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.includes(search) ||
    p.ref.includes(search)
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDir("asc")
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ChevronDown className="size-3 text-muted-foreground/50" />
    return sortDir === "asc" ? (
      <ChevronUp className="size-3 text-primary" />
    ) : (
      <ChevronDown className="size-3 text-primary" />
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Cadastros</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Produtos</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Busque por nome, codigo ou referencia interna"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <button className="text-sm text-primary hover:underline">
            Busca avancada
          </button>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="size-4" />
          Cadastrar novo produto
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Produtos cadastrados</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                A listagem abaixo exibe os seus produtos cadastrados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground gap-1.5">
                <RefreshCw className="size-3.5" />
                Atualizar listagem
              </Button>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground gap-1.5">
                <FileSpreadsheet className="size-3.5" />
                Exportar como planilha
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 hover:bg-primary/5">
                <TableHead className="pl-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Nome do produto
                    <SortIcon column="name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Tipo de variacao
                    <SortIcon column="type" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("code")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Codigo
                    <SortIcon column="code" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("ref")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Referencia interna
                    <SortIcon column="ref" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Estoque total</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Preco de venda
                    <SortIcon column="price" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 text-foreground"
                  >
                    Situacao
                    <SortIcon column="status" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.code}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{product.ref}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{product.stock}</TableCell>
                  <TableCell className="text-sm text-foreground">{product.price}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10">
                      {product.status}
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
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-primary/5">
            <span className="text-sm font-semibold text-foreground">
              TOTAL: <span className="font-normal">38310 Produtos</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
