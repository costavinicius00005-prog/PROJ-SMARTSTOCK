"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDownToLine, ArrowUpFromLine, AlertTriangle, CheckCircle2, PlusCircle, RefreshCw } from "lucide-react"

type Account = {
  id: string
  type: "PAGAR" | "RECEBER"
  description: string
  partyName: string | null
  amount: number
  dueDate: string
  status: "ABERTO" | "PAGO" | "CANCELADO"
  overdue: boolean
}

type Summary = {
  toPay: { count: number; total: number }
  toReceive: { count: number; total: number }
  overdue: { count: number; total: number }
  paidThisMonth: { count: number; total: number }
}

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

export function FinancialContent() {
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [filter, setFilter] = React.useState<"TODAS" | "PAGAR" | "RECEBER">("TODAS")
  const [loading, setLoading] = React.useState(true)
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [creating, setCreating] = React.useState(false)

  const [form, setForm] = React.useState({
    type: "PAGAR",
    description: "",
    partyName: "",
    amount: "",
    dueDate: "",
  })

  async function load() {
    setLoading(true)
    setFeedback(null)
    try {
      const [summaryResponse, accountsResponse] = await Promise.all([
        fetch("/api/finance/summary", { cache: "no-store" }),
        fetch("/api/finance/accounts", { cache: "no-store" }),
      ])
      setSummary(await summaryResponse.json())
      setAccounts(await accountsResponse.json())
    } catch {
      setFeedback({ type: "error", text: "Nao foi possivel carregar o financeiro." })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  const visible = accounts.filter((a) => filter === "TODAS" || a.type === filter)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setCreating(true)
    setFeedback(null)
    try {
      const amount = Number(form.amount.replace(",", "."))
      const response = await fetch("/api/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          partyName: form.partyName || null,
          amount,
          dueDate: form.dueDate,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.message ?? "Falha ao criar conta.")
      setForm({ type: "PAGAR", description: "", partyName: "", amount: "", dueDate: "" })
      setFeedback({ type: "ok", text: "Conta lancada no financeiro." })
      await load()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao criar conta." })
    } finally {
      setCreating(false)
    }
  }

  async function changeStatus(account: Account, status: Account["status"]) {
    setFeedback(null)
    try {
      const response = await fetch(`/api/finance/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error("Falha ao atualizar.")
      setFeedback({ type: "ok", text: "Conta atualizada." })
      await load()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao atualizar." })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Contas a pagar e a receber reais, lancadas no mesmo banco de dados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            feedback.type === "ok"
              ? "border-green-500/30 bg-green-500/10 text-green-600"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading && !summary && (
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">A pagar (aberto)</CardTitle>
              <ArrowUpFromLine className="size-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{money(summary.toPay.total)}</p>
              <p className="text-xs text-muted-foreground">{summary.toPay.count} conta(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">A receber (aberto)</CardTitle>
              <ArrowDownToLine className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{money(summary.toReceive.total)}</p>
              <p className="text-xs text-muted-foreground">{summary.toReceive.count} conta(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Vencidas</CardTitle>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{money(summary.overdue.total)}</p>
              <p className="text-xs text-muted-foreground">{summary.overdue.count} conta(s) atrasada(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pago neste mes</CardTitle>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{money(summary.paidThisMonth.total)}</p>
              <p className="text-xs text-muted-foreground">{summary.paidThisMonth.count} baixa(s)</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Novo lancamento</h2>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="PAGAR">A pagar</option>
              <option value="RECEBER">A receber</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descricao</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="NF 1234 - mercadorias"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="partyName">Fornecedor / cliente</Label>
            <Input
              id="partyName"
              value={form.partyName}
              onChange={(e) => setForm({ ...form, partyName: e.target.value })}
              placeholder="opcional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Lancando..." : "Lancar conta"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Contas</h2>
          <div className="flex items-center gap-1">
            {(["TODAS", "PAGAR", "RECEBER"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "TODAS" ? "Todas" : f === "PAGAR" ? "A pagar" : "A receber"}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Descricao</th>
                <th className="pb-2 pr-4 font-medium">Fornecedor / cliente</th>
                <th className="pb-2 pr-4 font-medium">Vencimento</th>
                <th className="pb-2 pr-4 font-medium">Valor</th>
                <th className="pb-2 pr-4 font-medium">Situacao</th>
                <th className="pb-2 font-medium">Baixar / alterar</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((account) => (
                <tr key={account.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant="secondary"
                      className={account.type === "PAGAR" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-700"}
                    >
                      {account.type === "PAGAR" ? "A pagar" : "A receber"}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-foreground">{account.description}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{account.partyName ?? "-"}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {formatDate(account.dueDate)}
                    {account.overdue && <Badge variant="destructive" className="ml-2">vencida</Badge>}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-foreground">{money(account.amount)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant={account.status === "PAGO" ? "default" : "secondary"}
                      className={account.status === "PAGO" ? "bg-[#22c55e] text-white border-0" : ""}
                    >
                      {account.status === "PAGO" ? "Pago" : account.status === "CANCELADO" ? "Cancelado" : "Em aberto"}
                    </Badge>
                  </td>
                  <td className="py-2.5">
                    <select
                      value={account.status}
                      onChange={(e) => changeStatus(account, e.target.value as Account["status"])}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="ABERTO">Em aberto</option>
                      <option value="PAGO">Pago / Recebido</option>
                      <option value="CANCELADO">Cancelar</option>
                    </select>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Nenhuma conta neste filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
