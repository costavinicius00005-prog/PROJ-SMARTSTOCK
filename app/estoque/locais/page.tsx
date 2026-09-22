"use client"

import * as React from "react"
import { ErpLayout } from "@/components/erp-layout"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, PlusCircle, Trash2, RefreshCw } from "lucide-react"

type Location = { id: string; name: string; description: string | null; movementCount: number }

export default function StockLocationsPage() {
  const [locations, setLocations] = React.useState<Location[]>([])
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)

  async function load() {
    try {
      const response = await fetch("/api/stock/locations", { cache: "no-store" })
      setLocations(await response.json())
    } catch {
      setFeedback({ type: "error", text: "Falha ao carregar locais." })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setFeedback(null)
    const response = await fetch("/api/stock/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    })
    const json = await response.json()
    if (!response.ok) {
      setFeedback({ type: "error", text: json?.message ?? "Falha ao criar local." })
      return
    }
    setName("")
    setDescription("")
    setFeedback({ type: "ok", text: "Local cadastrado." })
    await load()
  }

  async function remove(location: Location) {
    if (!window.confirm(`Excluir o local "${location.name}"?`)) return
    setFeedback(null)
    const response = await fetch(`/api/stock/locations/${location.id}`, { method: "DELETE" })
    if (!response.ok) {
      const json = await response.json().catch(() => null)
      setFeedback({ type: "error", text: json?.message ?? "Falha ao excluir." })
      return
    }
    setFeedback({ type: "ok", text: "Local excluido." })
    await load()
  }

  return (
    <ErpLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Locais de Estoque</h1>
            <p className="text-sm text-muted-foreground">
              Depósitos e pontos de armazenamento usados nas movimentacoes de estoque.
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

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Novo local</h2>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Deposito Principal"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Endereco ou observacao"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Cadastrar local
              </Button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Spinner className="size-8" />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Locais cadastrados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {locations.map((location) => (
                <div key={location.id} className="flex items-start justify-between rounded-lg border border-border/60 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{location.description ?? "Sem descricao"}</p>
                      <Badge variant="secondary" className="mt-2">
                        {location.movementCount} movimentacao(oes)
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => remove(location)}>
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {locations.length === 0 && (
                <p className="col-span-full py-6 text-center text-muted-foreground">
                  Nenhum local cadastrado ainda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ErpLayout>
  )
}
