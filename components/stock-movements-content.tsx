"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, MapPin, PlusCircle, RefreshCw } from "lucide-react"

type Summary = {
  productCount: number
  totalUnits: number
  lowStockCount: number
  movementCount: number
  locationCount: number
}

type Product = { id: string; name: string; internalCode: string; stockAvailable: number }
type Location = { id: string; name: string; description: string | null; movementCount: number }
type Movement = {
  id: string
  productId: string
  productName: string
  productCode: string
  locationId: string | null
  locationName: string | null
  type: "ENTRADA" | "SAIDA" | "AJUSTE"
  quantity: number
  note: string | null
  createdAt: string
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

export function StockMovementsContent() {
  const [summary, setSummary] = React.useState<Summary | null>(null)
  const [movements, setMovements] = React.useState<Movement[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [loading, setLoading] = React.useState(true)
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({ productId: "", type: "ENTRADA", quantity: "", locationId: "", note: "" })

  async function load() {
    setLoading(true)
    try {
      const [s, m, p, l] = await Promise.all([
        fetch("/api/stock/summary").then((r) => r.json()),
        fetch("/api/stock/movements").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/stock/locations").then((r) => r.json()),
      ])
      setSummary(s)
      setMovements(m)
      setProducts(p)
      setLocations(l)
    } catch {
      setFeedback({ type: "error", text: "Nao foi possivel carregar o estoque." })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const quantity = Number(form.quantity.replace(",", "."))
      const response = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          type: form.type,
          quantity: form.type === "AJUSTE" ? quantity : Math.abs(quantity),
          locationId: form.locationId || null,
          note: form.note || null,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.message ?? "Falha ao lancar movimentacao.")
      setForm({ ...form, quantity: "", note: "" })
      setFeedback({ type: "ok", text: "Movimentacao lancada e saldo do produto atualizado." })
      await load()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao lancar." })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Estoque - Movimentacoes</h1>
          <p className="text-sm text-muted-foreground">
            Entradas, saidas e ajustes lancados direto no banco, atualizando o saldo dos produtos.
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

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Produtos</CardTitle>
              <Package className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary.productCount}</p>
              <p className="text-xs text-muted-foreground">{summary.totalUnits} unidades em estoque</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Estoque baixo</CardTitle>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{summary.lowStockCount}</p>
              <p className="text-xs text-muted-foreground">produtos com 15 ou menos unidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Locais</CardTitle>
              <MapPin className="size-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary.locationCount}</p>
              <p className="text-xs text-muted-foreground">locais cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Movimentacoes</CardTitle>
              <RefreshCw className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{summary.movementCount}</p>
              <p className="text-xs text-muted-foreground">lancamentos registrados</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Nova movimentacao</h2>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="product">Produto</Label>
            <select
              id="product"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              required
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (saldo: {p.stockAvailable})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saida</option>
              <option value="AJUSTE">Ajuste (+/-)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder={form.type === "AJUSTE" ? "-5 ou +10" : "10"}
              inputMode="decimal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Local</Label>
            <select
              id="location"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Sem local</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Observacao</Label>
            <Input
              id="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="opcional"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Lancando..." : "Lancar"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Historico de movimentacoes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Data</th>
                <th className="pb-2 pr-4 font-medium">Produto</th>
                <th className="pb-2 pr-4 font-medium">Tipo</th>
                <th className="pb-2 pr-4 font-medium">Quantidade</th>
                <th className="pb-2 pr-4 font-medium">Local</th>
                <th className="pb-2 font-medium">Observacao</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                  <td className="py-2.5 pr-4 text-foreground">{m.productName}</td>
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant="secondary"
                      className={
                        m.type === "ENTRADA"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : m.type === "SAIDA"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-700"
                      }
                    >
                      {m.type === "ENTRADA" ? "Entrada" : m.type === "SAIDA" ? "Saida" : "Ajuste"}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    {m.type === "ENTRADA" ? "+" : m.type === "SAIDA" ? "-" : ""}
                    {m.quantity}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{m.locationName ?? "-"}</td>
                  <td className="py-2.5 text-muted-foreground">{m.note ?? "-"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhuma movimentacao lancada ainda.
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
