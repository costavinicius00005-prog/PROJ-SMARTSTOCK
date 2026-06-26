"use client"

import { useState } from "react"
import { Search, MoreVertical, Plus, Send } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const fiscalDocuments = [
  {
    id: 1,
    number: "257",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 110,94",
  },
  {
    id: 2,
    number: "256",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 135,20",
  },
  {
    id: 3,
    number: "255",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 134,00",
  },
  {
    id: 4,
    number: "254",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 43,20",
  },
  {
    id: 5,
    number: "253",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 100,00",
  },
  {
    id: 6,
    number: "252",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 2,00",
  },
  {
    id: 7,
    number: "251",
    model: "NFE Entrada",
    situation: "Uso autorizado",
    client: "MEIRE SOARES MENDONCA MORAIS LTDA",
    company: "SMARTSTOCK",
    cfop: "1202",
    emission: "Propria",
    emissionDate: "03/03/2026",
    entryExit: "03/03/2026",
    total: "R$ 187,20",
  },
]

const pageSizes = [10, 25, 50, 100]

export function FiscalDocumentsContent() {
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(25)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = fiscalDocuments.filter(
    (doc) =>
      doc.client.toLowerCase().includes(search.toLowerCase()) ||
      doc.number.includes(search)
  )

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>Fiscal</span>
        <span>{">"}</span>
        <span className="text-foreground font-medium">Documentos fiscais</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Resultado para: Loja: SMARTSTOCK, Documentos entre 02/03/2026 e 03/03/2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => setShowFilters(!showFilters)}
          >
            Exibir filtros
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 text-sm">
            <Send className="size-3.5" />
            Enviar arquivos para contabilidade
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="size-4" />
            Lancar documento fiscal
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Documentos fiscais</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Visualizar:</span>
              {pageSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`px-1.5 py-0.5 rounded text-sm transition-colors ${
                    pageSize === size
                      ? "font-bold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 text-foreground font-medium">Numero</TableHead>
                <TableHead className="text-foreground font-medium">Modelo / situacao</TableHead>
                <TableHead className="text-foreground font-medium">Cliente / fornecedor</TableHead>
                <TableHead className="text-foreground font-medium">CFOP</TableHead>
                <TableHead className="text-foreground font-medium">Emissao</TableHead>
                <TableHead className="text-foreground font-medium">Data de emissao</TableHead>
                <TableHead className="text-foreground font-medium">Entrada / saida</TableHead>
                <TableHead className="text-right text-foreground font-medium">Valor total</TableHead>
                <TableHead className="text-center text-foreground font-medium">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 text-sm text-foreground font-medium">
                    {doc.number}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{doc.model}</span>
                      <span className="text-xs text-muted-foreground">{doc.situation}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{doc.client}</span>
                      <span className="text-xs text-muted-foreground">{doc.company}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.cfop}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.emission}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.emissionDate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.entryExit}</TableCell>
                  <TableCell className="text-right text-sm text-foreground">{doc.total}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreVertical className="size-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Baixar XML</DropdownMenuItem>
                        <DropdownMenuItem>Baixar DANFE</DropdownMenuItem>
                        <DropdownMenuItem>Cancelar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pagina</span>
              <Button variant="outline" size="sm" className="size-7 p-0 text-xs font-bold">
                1
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
