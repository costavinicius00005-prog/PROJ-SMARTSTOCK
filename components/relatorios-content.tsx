"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type Product = {
  id: string
  name: string
  category: string
  costValue: number
  salePrice: number
  stockAvailable?: number
  stockQuantity?: number
}

type FinanceSummary = {
  toPay: { count: number; total: number }
  toReceive: { count: number; total: number }
  overdue: { count: number; total: number }
  paidThisMonth: { count: number; total: number }
}

const stockOf = (p: Product) => p.stockAvailable ?? p.stockQuantity ?? 0

export function RelatoriosContent() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [finance, setFinance] = React.useState<FinanceSummary | null>(null)
  const [dashboard, setDashboard] = React.useState<{ revenueThisMonth: number; openSalesOrders: number } | null>(null)
  const [ordersCount, setOrdersCount] = React.useState(0)
  const [quotesCount, setQuotesCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, f, d, o, q] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/finance/summary", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/system/dashboard", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/sales/orders", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/sales/quotes", { cache: "no-store" }).then((r) => r.json()),
      ])
      setProducts(p)
      setFinance(f)
      setDashboard(d)
      setOrdersCount(o.length)
      setQuotesCount(q.length)
    } catch {
      setError("Nao foi possivel gerar os relatorios.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  const byCategory = new Map<string, { items: number; units: number; cost: number; sale: number }>()
  for (const p of products) {
    const row = byCategory.get(p.category) ?? { items: 0, units: 0, cost: 0, sale: 0 }
    row.items += 1
    row.units += stockOf(p)
    row.cost += (p.costValue ?? 0) * stockOf(p)
    row.sale += (p.salePrice ?? 0) * stockOf(p)
    byCategory.set(p.category, row)
  }
  const lowStock = products.filter((p) => stockOf(p) <= 15)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">
            Relatorios gerenciais calculados com os dados reais do banco.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading && products.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      )}

      {!error && (
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Valor do estoque por categoria</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Categoria</th>
                      <th className="pb-2 pr-4 font-medium">Itens</th>
                      <th className="pb-2 pr-4 font-medium">Unidades</th>
                      <th className="pb-2 pr-4 font-medium">Valor de custo</th>
                      <th className="pb-2 font-medium">Valor de venda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byCategory.entries()].map(([category, row]) => (
                      <tr key={category} className="border-b border-border/60">
                        <td className="py-2.5 pr-4 text-foreground">{category}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{row.items}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{row.units}</td>
                        <td className="py-2.5 pr-4 text-foreground">{money(row.cost)}</td>
                        <td className="py-2.5 font-medium text-foreground">{money(row.sale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="size-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">Produtos com estoque baixo (15 ou menos)</h2>
              </div>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {lowStock.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.name} - {stockOf(p)} un
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            {finance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">A pagar em aberto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{money(finance.toPay.total)}</p>
                    <p className="text-xs text-muted-foreground">{finance.toPay.count} conta(s)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">A receber em aberto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">{money(finance.toReceive.total)}</p>
                    <p className="text-xs text-muted-foreground">{finance.toReceive.count} conta(s)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Contas vencidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">{money(finance.overdue.total)}</p>
                    <p className="text-xs text-muted-foreground">{finance.overdue.count} conta(s)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Baixado neste mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{money(finance.paidThisMonth.total)}</p>
                    <p className="text-xs text-muted-foreground">{finance.paidThisMonth.count} baixa(s)</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vendas" className="space-y-4">
            {dashboard && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Receita do mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-emerald-600">{money(dashboard.revenueThisMonth)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Pedidos registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{ordersCount}</p>
                    <p className="text-xs text-muted-foreground">{dashboard.openSalesOrders} em aberto</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Orcamentos registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{quotesCount}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
