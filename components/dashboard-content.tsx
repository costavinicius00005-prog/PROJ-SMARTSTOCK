"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  RefreshCw,
} from "lucide-react"

type DashboardData = {
  clients: number
  suppliers: number
  products: number
  lowStockProducts: number
  openSalesOrders: number
  revenueThisMonth: number
  pendingDeliveries: number
  overdueAccounts: number
  toPay: number
  toReceive: number
}

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function DashboardContent() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/system/dashboard", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
    } catch {
      setError("Nao foi possivel carregar os indicadores.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Visao Geral</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores reais da operacao, calculados direto do banco de dados.
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

      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Receita do mes</CardTitle>
                <DollarSign className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{money(data.revenueThisMonth)}</p>
                <p className="text-xs text-muted-foreground">pedidos confirmados e entregues</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pedidos abertos</CardTitle>
                <ShoppingCart className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.openSalesOrders}</p>
                <Link href="/vendas/pedidos" className="text-xs text-primary hover:underline">
                  ver pedidos
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Produtos em estoque baixo</CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.lowStockProducts}</p>
                <p className="text-xs text-muted-foreground">de {data.products} produtos cadastrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Entregas pendentes</CardTitle>
                <Truck className="size-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.pendingDeliveries}</p>
                <Link href="/entregas" className="text-xs text-primary hover:underline">
                  ver rotas
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Clientes</CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.clients}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Fornecedores</CardTitle>
                <Building2 className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{data.suppliers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">A receber (aberto)</CardTitle>
                <ArrowDownToLine className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{money(data.toReceive)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">A pagar (aberto)</CardTitle>
                <ArrowUpFromLine className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{money(data.toPay)}</p>
                {data.overdueAccounts > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {data.overdueAccounts} vencida(s)
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
