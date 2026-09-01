"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RegisteredProduct } from "@/src/domain/catalog/registered-product"

type SortColumn = keyof Pick<
  RegisteredProduct,
  "name" | "category" | "brand" | "internalCode" | "variationType" | "salePrice"
>

export function ProductsContent() {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<RegisteredProduct[]>([])
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortColumn>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const loadProducts = async () => {
    setStatus("loading")

    try {
      const response = await fetch("/api/products", { cache: "no-store" })

      if (!response.ok) {
        throw new Error("Nao foi possivel listar os produtos.")
      }

      const data = (await response.json()) as RegisteredProduct[]
      setProducts(data)
      setStatus("loaded")
    } catch {
      setStatus("error")
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return products
    }

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.brand,
        product.internalCode,
        product.variationType,
        product.barcode,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch)),
    )
  }, [products, search])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const firstValue = String(a[sortColumn] ?? "")
      const secondValue = String(b[sortColumn] ?? "")
      const result = firstValue.localeCompare(secondValue, "pt-BR", { numeric: true })

      return sortDir === "asc" ? result : -result
    })
  }, [filteredProducts, sortColumn, sortDir])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortColumn(column)
    setSortDir("asc")
  }

  const deleteProduct = async (product: RegisteredProduct) => {
    const canDelete = window.confirm(`Excluir o produto "${product.name || product.internalCode}"?`)

    if (!canDelete) {
      return
    }

    setDeletingProductId(product.id)

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Nao foi possivel excluir o produto.")
      }

      setProducts((currentProducts) =>
        currentProducts.filter((currentProduct) => currentProduct.id !== product.id),
      )
    } catch {
      setStatus("error")
    } finally {
      setDeletingProductId(null)
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ChevronDown className="size-3 text-muted-foreground/50" />

    return sortDir === "asc" ? (
      <ChevronUp className="size-3 text-primary" />
    ) : (
      <ChevronDown className="size-3 text-primary" />
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Cadastros</span>
        <span>{">"}</span>
        <span className="font-medium text-foreground">Produtos</span>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Busque por nome, categoria, codigo ou barras"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-card pl-9"
            />
          </div>
        </div>
        <Button asChild className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/cadastros/produtos/novo">
            <Plus className="size-4" />
            Cadastrar novo produto
          </Link>
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Produtos cadastrados
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                A listagem abaixo exibe os produtos gravados no banco.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-sm text-muted-foreground"
                onClick={loadProducts}
              >
                <RefreshCw className="size-3.5" />
                Atualizar listagem
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
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
                <SortableHead column="name" onSort={handleSort} sortIcon={<SortIcon column="name" />}>
                  Nome do produto
                </SortableHead>
                <SortableHead column="category" onSort={handleSort} sortIcon={<SortIcon column="category" />}>
                  Categoria
                </SortableHead>
                <SortableHead column="brand" onSort={handleSort} sortIcon={<SortIcon column="brand" />}>
                  Marca
                </SortableHead>
                <SortableHead column="internalCode" onSort={handleSort} sortIcon={<SortIcon column="internalCode" />}>
                  Codigo interno
                </SortableHead>
                <SortableHead column="variationType" onSort={handleSort} sortIcon={<SortIcon column="variationType" />}>
                  Tipo de variacao
                </SortableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Codigo de barras</TableHead>
                <TableHead>Estoque disponivel</TableHead>
                <SortableHead column="salePrice" onSort={handleSort} sortIcon={<SortIcon column="salePrice" />}>
                  Preco de venda
                </SortableHead>
                <TableHead className="text-center">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status === "loading" ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "error" ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-sm text-destructive">
                    Nao foi possivel carregar os produtos.
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "loaded" && sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-sm text-muted-foreground">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              ) : null}

              {status === "loaded" &&
                sortedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="pl-4 text-sm text-foreground">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.brand || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.internalCode}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.variationType || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.unitOfMeasure}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.barcode || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.stockAvailable}</TableCell>
                    <TableCell className="text-sm text-foreground">
                      {formatCurrency(product.salePrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreVertical className="size-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/cadastros/produtos/${product.id}/editar`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={deletingProductId === product.id}
                            onClick={() => deleteProduct(product)}
                          >
                            {deletingProductId === product.id ? (
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
          <div className="flex items-center justify-between border-t border-border bg-primary/5 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              TOTAL: <span className="font-normal">{sortedProducts.length} Produtos</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SortableHead({
  column,
  onSort,
  sortIcon,
  children,
}: {
  column: SortColumn
  onSort: (column: SortColumn) => void
  sortIcon: ReactNode
  children: ReactNode
}) {
  return (
    <TableHead>
      <button onClick={() => onSort(column)} className="flex items-center gap-1 text-foreground">
        {children}
        {sortIcon}
      </button>
    </TableHead>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
