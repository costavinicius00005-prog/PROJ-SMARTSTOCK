"use client"

import * as React from "react"
import { AlertTriangle, Boxes, Download, Printer, RefreshCw, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// ---------- tipos e utilitarios ----------

type Product = {
  id: string
  name: string
  internalCode: string | null
  category: string | null
  brand: string | null
  unitOfMeasure: string | null
  costValue: number | null
  salePrice: number | null
  stockQuantity: number | null
}

type SaleItem = { productId: string; productCode: string; productName: string; quantity: number; netSubtotal: number }
type SalePayment = { methodCode: string; methodName: string; amount: number }
type Sale = {
  id: string
  number: number
  clientName: string | null
  operator: string
  status: "COMPLETED" | "CANCELLED"
  subtotal: number
  itemDiscount: number
  generalDiscount: number
  total: number
  items: SaleItem[]
  payments: SalePayment[]
  createdAt: string
}

type ReportId = "vendas" | "estoque" | "baixo"

const REPORTS: { id: ReportId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "vendas", label: "Vendas", icon: ShoppingCart },
  { id: "estoque", label: "Estoque total", icon: Boxes },
  { id: "baixo", label: "Estoque baixo", icon: AlertTriangle },
]

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const qty = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
const num = (value: number) => value.toFixed(2).replace(".", ",")
const stock = (p: Product) => Number(p.stockQuantity ?? 0)
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

function downloadCsv(name: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = "﻿" + [header, ...rows].map((r) => r.map(escape).join(";")).join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${name}-${isoDay(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "danger" | "warn" }) {
  const color = tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-foreground"
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

// ---------- pagina ----------

export function RelatoriosContent() {
  const [report, setReport] = React.useState<ReportId>("vendas")
  const [products, setProducts] = React.useState<Product[]>([])
  const [sales, setSales] = React.useState<Sale[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [p, s] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/sales/checkout/sales?limit=1000", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject())),
      ])
      setProducts(p ?? [])
      setSales(s ?? [])
    } catch {
      setError("Nao foi possivel carregar os dados dos relatorios.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const current = REPORTS.find((r) => r.id === report)!

  return (
    <div className="space-y-6 p-6">
      <style>{"@media print { body * { visibility: hidden } #report-print, #report-print * { visibility: visible } #report-print { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 16px } .no-print { display: none !important } }"}</style>

      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">Calculados na hora com os dados do banco. Use Imprimir para gerar PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="size-3.5" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      <div className="no-print grid gap-3 sm:grid-cols-3">
        {REPORTS.map((r) => {
          const Icon = r.icon
          const active = r.id === report
          return (
            <button
              key={r.id}
              onClick={() => setReport(r.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"}`}
            >
              <Icon className={`size-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${active ? "text-primary" : "text-foreground"}`}>{r.label}</span>
            </button>
          )
        })}
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Spinner className="size-8" /></div>
      ) : (
        <div id="report-print" className="space-y-4">
          <div className="hidden print:block">
            <h2 className="text-lg font-semibold">Relatorio de {current.label.toLowerCase()}</h2>
            <p className="text-xs">Emitido em {new Date().toLocaleString("pt-BR")}</p>
          </div>
          {report === "vendas" && <SalesReport sales={sales} />}
          {report === "estoque" && <StockReport products={products} />}
          {report === "baixo" && <LowStockReport products={products} />}
        </div>
      )}
    </div>
  )
}

// ---------- relatorio de vendas ----------

function SalesReport({ sales }: { sales: Sale[] }) {
  const now = new Date()
  const [from, setFrom] = React.useState(isoDay(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [to, setTo] = React.useState(isoDay(now))
  const [status, setStatus] = React.useState<"COMPLETED" | "CANCELLED" | "ALL">("COMPLETED")

  const filtered = React.useMemo(() => {
    return sales
      .filter((s) => {
        const day = isoDay(new Date(s.createdAt))
        return day >= from && day <= to && (status === "ALL" || s.status === status)
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [sales, from, to, status])

  const completed = filtered.filter((s) => s.status === "COMPLETED")
  const revenue = completed.reduce((t, s) => t + Number(s.total), 0)
  const discounts = completed.reduce((t, s) => t + Number(s.itemDiscount) + Number(s.generalDiscount), 0)
  const units = completed.reduce((t, s) => t + s.items.reduce((u, i) => u + Number(i.quantity), 0), 0)
  const cancelled = filtered.filter((s) => s.status === "CANCELLED").length

  const byProduct = new Map<string, { code: string; name: string; quantity: number; total: number }>()
  const byPayment = new Map<string, { name: string; count: number; total: number }>()
  for (const s of completed) {
    for (const i of s.items) {
      const row = byProduct.get(i.productId) ?? { code: i.productCode, name: i.productName, quantity: 0, total: 0 }
      row.quantity += Number(i.quantity)
      row.total += Number(i.netSubtotal)
      byProduct.set(i.productId, row)
    }
    for (const p of s.payments) {
      const row = byPayment.get(p.methodCode) ?? { name: p.methodName, count: 0, total: 0 }
      row.count += 1
      row.total += Number(p.amount)
      byPayment.set(p.methodCode, row)
    }
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.total - a.total).slice(0, 10)
  const payments = [...byPayment.values()].sort((a, b) => b.total - a.total)

  const exportCsv = () =>
    downloadCsv(
      "relatorio-vendas",
      ["Venda", "Data", "Cliente", "Operador", "Formas de pagamento", "Itens", "Descontos", "Total", "Situacao"],
      filtered.map((s) => [
        s.number,
        new Date(s.createdAt).toLocaleString("pt-BR"),
        s.clientName ?? "Consumidor final",
        s.operator,
        s.payments.map((p) => p.methodName).join(" + "),
        s.items.reduce((u, i) => u + Number(i.quantity), 0),
        num(Number(s.itemDiscount) + Number(s.generalDiscount)),
        num(Number(s.total)),
        s.status === "COMPLETED" ? "Concluida" : "Cancelada",
      ]),
    )

  return (
    <>
      <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1"><Label htmlFor="from">De</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
        <div className="space-y-1"><Label htmlFor="to">Ate</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
        <div className="space-y-1">
          <Label htmlFor="status">Situacao</Label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="COMPLETED">Concluidas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>
        <Button variant="outline" className="ml-auto" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" /> CSV</Button>
      </div>
      <p className="hidden text-xs print:block">Periodo: {new Date(from + "T00:00").toLocaleDateString("pt-BR")} a {new Date(to + "T00:00").toLocaleDateString("pt-BR")}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Vendas concluidas" value={String(completed.length)} hint={cancelled ? `${cancelled} cancelada(s) no filtro` : undefined} />
        <Kpi label="Faturamento" value={brl(revenue)} />
        <Kpi label="Ticket medio" value={brl(completed.length ? revenue / completed.length : 0)} />
        <Kpi label="Unidades vendidas" value={qty(units)} />
        <Kpi label="Descontos concedidos" value={brl(discounts)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Produtos mais vendidos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.code}><TableCell>{p.name}<span className="block text-xs text-muted-foreground">{p.code}</span></TableCell><TableCell className="text-right">{qty(p.quantity)}</TableCell><TableCell className="text-right font-medium">{brl(p.total)}</TableCell></TableRow>
                ))}
                {!topProducts.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem vendas no periodo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recebido por forma de pagamento</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Forma</TableHead><TableHead className="text-right">Vendas</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell className="text-right">{p.count}</TableCell><TableCell className="text-right font-medium">{brl(p.total)}</TableCell><TableCell className="text-right text-muted-foreground">{revenue ? ((p.total / revenue) * 100).toFixed(1).replace(".", ",") : "0"}%</TableCell></TableRow>
                ))}
                {!payments.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem vendas no periodo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Vendas do periodo ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Venda</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Operador</TableHead><TableHead>Pagamento</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Situacao</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">#{s.number}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{new Date(s.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell>{s.clientName ?? "Consumidor final"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.operator}</TableCell>
                  <TableCell className="text-sm">{s.payments.map((p) => p.methodName).join(" + ")}</TableCell>
                  <TableCell className="text-right font-medium">{brl(Number(s.total))}</TableCell>
                  <TableCell><Badge variant={s.status === "COMPLETED" ? "secondary" : "destructive"}>{s.status === "COMPLETED" ? "Concluida" : "Cancelada"}</Badge></TableCell>
                </TableRow>
              ))}
              {!filtered.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma venda no periodo selecionado.</TableCell></TableRow>}
            </TableBody>
            {completed.length > 0 && (
              <TableFooter><TableRow><TableCell colSpan={5}>Total concluido</TableCell><TableCell className="text-right">{brl(revenue)}</TableCell><TableCell /></TableRow></TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ---------- relatorio de estoque total ----------

function StockReport({ products }: { products: Product[] }) {
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("")
  const categories = [...new Set(products.map((p) => p.category ?? "Sem categoria"))].sort()

  const rows = products
    .filter((p) => !category || (p.category ?? "Sem categoria") === category)
    .filter((p) => !search.trim() || `${p.name} ${p.internalCode ?? ""} ${p.brand ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

  const units = rows.reduce((t, p) => t + stock(p), 0)
  const costTotal = rows.reduce((t, p) => t + stock(p) * Number(p.costValue ?? 0), 0)
  const saleTotal = rows.reduce((t, p) => t + stock(p) * Number(p.salePrice ?? 0), 0)

  const byCategory = new Map<string, { items: number; units: number; cost: number; sale: number }>()
  for (const p of rows) {
    const key = p.category ?? "Sem categoria"
    const row = byCategory.get(key) ?? { items: 0, units: 0, cost: 0, sale: 0 }
    row.items += 1
    row.units += stock(p)
    row.cost += stock(p) * Number(p.costValue ?? 0)
    row.sale += stock(p) * Number(p.salePrice ?? 0)
    byCategory.set(key, row)
  }

  const exportCsv = () =>
    downloadCsv(
      "relatorio-estoque-total",
      ["Codigo", "Produto", "Categoria", "Marca", "Unidade", "Quantidade", "Custo unitario", "Custo total", "Preco de venda", "Valor de venda"],
      rows.map((p) => [p.internalCode, p.name, p.category, p.brand, p.unitOfMeasure, qty(stock(p)), num(Number(p.costValue ?? 0)), num(stock(p) * Number(p.costValue ?? 0)), num(Number(p.salePrice ?? 0)), num(stock(p) * Number(p.salePrice ?? 0))]),
    )

  return (
    <>
      <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1"><Label htmlFor="search">Buscar</Label><Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, codigo ou marca" className="w-64" /></div>
        <div className="space-y-1">
          <Label htmlFor="category">Categoria</Label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="">Todas</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button variant="outline" className="ml-auto" onClick={exportCsv} disabled={!rows.length}><Download className="size-4" /> CSV</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Produtos" value={String(rows.length)} />
        <Kpi label="Unidades em estoque" value={qty(units)} />
        <Kpi label="Valor de custo" value={brl(costTotal)} />
        <Kpi label="Valor de venda" value={brl(saleTotal)} />
        <Kpi label="Lucro potencial" value={brl(saleTotal - costTotal)} hint={costTotal ? `margem de ${(((saleTotal - costTotal) / costTotal) * 100).toFixed(1).replace(".", ",")}% sobre o custo` : undefined} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Resumo por categoria</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Produtos</TableHead><TableHead className="text-right">Unidades</TableHead><TableHead className="text-right">Valor de custo</TableHead><TableHead className="text-right">Valor de venda</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...byCategory.entries()].sort((a, b) => b[1].cost - a[1].cost).map(([name, r]) => (
                <TableRow key={name}><TableCell>{name}</TableCell><TableCell className="text-right">{r.items}</TableCell><TableCell className="text-right">{qty(r.units)}</TableCell><TableCell className="text-right">{brl(r.cost)}</TableCell><TableCell className="text-right font-medium">{brl(r.sale)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Posicao de estoque por produto ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Codigo</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Qtd.</TableHead><TableHead className="text-right">Custo unit.</TableHead><TableHead className="text-right">Custo total</TableHead><TableHead className="text-right">Preco venda</TableHead><TableHead className="text-right">Valor venda</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-muted-foreground">{p.internalCode ?? "-"}</TableCell>
                  <TableCell className="font-medium">{p.name}<span className="block text-xs font-normal text-muted-foreground">{p.brand ?? ""}</span></TableCell>
                  <TableCell>{p.category ?? "-"}</TableCell>
                  <TableCell className={`text-right ${stock(p) < 15 ? "font-semibold text-amber-600" : ""}`}>{qty(stock(p))} <span className="text-xs text-muted-foreground">{(p.unitOfMeasure ?? "").split(" ")[0]}</span></TableCell>
                  <TableCell className="text-right">{brl(Number(p.costValue ?? 0))}</TableCell>
                  <TableCell className="text-right">{brl(stock(p) * Number(p.costValue ?? 0))}</TableCell>
                  <TableCell className="text-right">{brl(Number(p.salePrice ?? 0))}</TableCell>
                  <TableCell className="text-right font-medium">{brl(stock(p) * Number(p.salePrice ?? 0))}</TableCell>
                </TableRow>
              ))}
              {!rows.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum produto encontrado.</TableCell></TableRow>}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter><TableRow><TableCell colSpan={3}>Total</TableCell><TableCell className="text-right">{qty(units)}</TableCell><TableCell /><TableCell className="text-right">{brl(costTotal)}</TableCell><TableCell /><TableCell className="text-right">{brl(saleTotal)}</TableCell></TableRow></TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ---------- relatorio de estoque baixo ----------

function LowStockReport({ products }: { products: Product[] }) {
  const [limit, setLimit] = React.useState(15)
  const target = limit * 2

  const rows = products.filter((p) => stock(p) < limit).sort((a, b) => stock(a) - stock(b) || a.name.localeCompare(b.name, "pt-BR"))
  const zero = rows.filter((p) => stock(p) <= 0).length
  const critical = rows.filter((p) => stock(p) > 0 && stock(p) <= limit / 3).length
  const suggestion = (p: Product) => Math.max(0, Math.ceil(target - stock(p)))
  const replenishCost = rows.reduce((t, p) => t + suggestion(p) * Number(p.costValue ?? 0), 0)

  const situation = (p: Product) =>
    stock(p) <= 0 ? { label: "Zerado", variant: "destructive" as const } : stock(p) <= limit / 3 ? { label: "Critico", variant: "destructive" as const } : { label: "Baixo", variant: "secondary" as const }

  const exportCsv = () =>
    downloadCsv(
      "relatorio-estoque-baixo",
      ["Codigo", "Produto", "Categoria", "Marca", "Quantidade", "Situacao", "Sugestao de compra", "Custo unitario", "Custo da reposicao"],
      rows.map((p) => [p.internalCode, p.name, p.category, p.brand, qty(stock(p)), situation(p).label, suggestion(p), num(Number(p.costValue ?? 0)), num(suggestion(p) * Number(p.costValue ?? 0))]),
    )

  return (
    <>
      <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="limit">Estoque menor que</Label>
          <Input id="limit" type="number" min={1} value={limit} onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))} className="w-32" />
        </div>
        <p className="text-xs text-muted-foreground">A sugestao de compra repoe cada produto ate {target} unidades (2x o limite).</p>
        <Button variant="outline" className="ml-auto" onClick={exportCsv} disabled={!rows.length}><Download className="size-4" /> CSV</Button>
      </div>
      <p className="hidden text-xs print:block">Criterio: estoque menor que {limit} unidades.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={`Produtos com menos de ${limit} un.`} value={String(rows.length)} hint={`de ${products.length} cadastrados`} tone={rows.length ? "warn" : undefined} />
        <Kpi label="Zerados" value={String(zero)} tone={zero ? "danger" : undefined} />
        <Kpi label={`Criticos (ate ${Math.floor(limit / 3)} un.)`} value={String(critical)} tone={critical ? "danger" : undefined} />
        <Kpi label="Custo estimado da reposicao" value={brl(replenishCost)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Produtos para repor ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Codigo</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Em estoque</TableHead><TableHead>Situacao</TableHead><TableHead className="text-right">Sugestao de compra</TableHead><TableHead className="text-right">Custo da reposicao</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => {
                const s = situation(p)
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">{p.internalCode ?? "-"}</TableCell>
                    <TableCell className="font-medium">{p.name}<span className="block text-xs font-normal text-muted-foreground">{p.brand ?? ""}</span></TableCell>
                    <TableCell>{p.category ?? "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{qty(stock(p))}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell className="text-right">{suggestion(p)} un.</TableCell>
                    <TableCell className="text-right">{brl(suggestion(p) * Number(p.costValue ?? 0))}</TableCell>
                  </TableRow>
                )
              })}
              {!rows.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum produto abaixo de {limit} unidades.</TableCell></TableRow>}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter><TableRow><TableCell colSpan={5}>Total da reposicao sugerida</TableCell><TableCell className="text-right">{rows.reduce((t, p) => t + suggestion(p), 0)} un.</TableCell><TableCell className="text-right">{brl(replenishCost)}</TableCell></TableRow></TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
