"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, Wallet, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

type Overview = {
  salesRevenueMonth: number
  receivedThisMonth: number
  expensesPaidMonth: number
  overdueExpenses: number
  overdueReceivables: number
  netResult: number
  receivablesOpen: number
  payablesOpen: number
}

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function AccountingContent() {
  const [data, setData] = React.useState<Overview | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const response = await fetch("/api/accounting/overview", { cache: "no-store" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
    } catch {
      setError("Nao foi possivel carregar o resultado contabil.")
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Contabilidade</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Resultado do periodo calculado com os dados reais do ERP: receitas de vendas (pedidos
            confirmados/entregues) e contas a receber pagas, menos as despesas pagas do mes.
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

      {!data && !error && (
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Receitas do mes</CardTitle>
                <TrendingUp className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{money(data.salesRevenueMonth + data.receivedThisMonth)}</p>
                <p className="text-xs text-muted-foreground">
                  vendas {money(data.salesRevenueMonth)} + recebimentos {money(data.receivedThisMonth)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Despesas pagas no mes</CardTitle>
                <TrendingDown className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{money(data.expensesPaidMonth)}</p>
                <p className="text-xs text-muted-foreground">contas a pagar baixadas no periodo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Resultado do periodo</CardTitle>
                <Wallet className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${
                    data.netResult >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {money(data.netResult)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.netResult >= 0 ? "superavit (receitas - despesas)" : "deficit (receitas - despesas)"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">A receber em aberto</CardTitle>
                <ArrowDownToLine className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{money(data.receivablesOpen)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">A pagar em aberto</CardTitle>
                <ArrowUpFromLine className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{money(data.payablesOpen)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Recebimentos em atraso</CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-amber-600">{money(data.overdueReceivables)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Contas vencidas a pagar</CardTitle>
                <AlertTriangle className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-amber-600">{money(data.overdueExpenses)}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
