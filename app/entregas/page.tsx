"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ErpLayout } from "@/components/erp-layout"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Truck, PlusCircle, Plus, RefreshCw, Radio, Navigation } from "lucide-react"
import { apiFetch } from "@/lib/auth-client"

type Delivery = {
  id: string
  orderId: string
  clientId: string
  number: string
  clientName: string
  clientPhone: string
  status: string
  scheduledDate: string | null
  city: string | null
  receiverName: string | null
  failureReason: string | null
  fullAddress?: string | null
  assigneeId?: number | null
  assigneeName?: string | null
  assigneeEmail?: string | null
}

type Deliverer = { id: number; email: string; name: string }

type LiveDelivery = {
  deliveryId: string
  orderNumber: string
  status: string
  fullAddress?: string | null
  assigneeName?: string | null
  assigneeEmail?: string | null
  clientName: string
  latitude?: number | null
  longitude?: number | null
  recordedAt?: string | null
  route?: { latitude: number; longitude: number; recordedAt: string }[]
}

type Order = {
  id: string
  number: string
  clientId: string
  status: string
  items: { productId: string; quantity: number }[]
}

const STATUS = ["Pendente", "Em rota", "Entregue", "Cancelada"]

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function EntregasPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [deliveries, setDeliveries] = React.useState<Delivery[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [deliverers, setDeliverers] = React.useState<Deliverer[]>([])
  const [live, setLive] = React.useState<LiveDelivery[]>([])
  const [liveOn, setLiveOn] = React.useState(false)
  const [liveAt, setLiveAt] = React.useState<Date | null>(null)
  const [loadingData, setLoadingData] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [orderId, setOrderId] = React.useState("")
  const [assigneeId, setAssigneeId] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [scheduledDate, setScheduledDate] = React.useState("")
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)

  async function loadData() {
    setLoadingData(true)
    setFeedback(null)
    try {
      const [list, orderList, delivererList] = await Promise.all([
        apiFetch("/api/deliveries"),
        apiFetch("/api/orders"),
        apiFetch("/api/deliverers"),
      ])
      setDeliveries((list as Delivery[]) ?? [])
      setOrders((orderList as Order[]) ?? [])
      setDeliverers((delivererList as Deliverer[]) ?? [])
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao carregar entregas." })
    } finally {
      setLoadingData(false)
    }
  }

  React.useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login")
      else loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  const usedOrderIds = new Set(deliveries.map((d) => d.orderId))
  const availableOrders = orders.filter(
    (o) => !usedOrderIds.has(o.id) && (o.status === "OPEN" || o.status === "CONFIRMED"),
  )

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!orderId) {
      setFeedback({ type: "error", text: "Selecione o pedido da rota." })
      return
    }
    setCreating(true)
    setFeedback(null)
    try {
      const body: Record<string, string> = { orderId }
      if (address.trim()) body.address = address.trim()
      if (city.trim()) body.city = city.trim()
      if (scheduledDate) body.scheduledDate = new Date(scheduledDate).toISOString()
      const created = (await apiFetch("/api/deliveries", { method: "POST", body: JSON.stringify(body) })) as Delivery
      if (assigneeId) {
        await apiFetch(`/api/deliveries/${created.id}/assignee`, {
          method: "PUT",
          body: JSON.stringify({ assigneeId: Number(assigneeId) }),
        })
      }
      setAssigneeId("")
      setAddress("")
      setCity("")
      setScheduledDate("")
      setOrderId("")
      setFeedback({ type: "ok", text: "Rota de entrega criada. Ela ja aparece no aplicativo mobile." })
      await loadData()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao criar rota." })
    } finally {
      setCreating(false)
    }
  }

  React.useEffect(() => {
    if (!liveOn) return
    let stopped = false
    const refresh = async () => {
      try {
        const rows = (await apiFetch("/api/deliveries/live")) as LiveDelivery[]
        if (!stopped) {
          setLive(rows ?? [])
          setLiveAt(new Date())
        }
      } catch {
        /* proxima leitura continua */
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 8000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [liveOn])

  function idadeDoPonto(recordedAt?: string | null): string {
    if (!recordedAt) return "sem sinal ainda"
    const delta = Date.now() - new Date(recordedAt).getTime()
    if (delta < 0) return "agora"
    if (delta < 60_000) return `há ${Math.max(0, Math.round(delta / 1000))} s`
    const min = Math.round(delta / 60_000)
    if (min < 60) return `há ${min} min`
    return `há ${Math.round(min / 60)} h`
  }

  async function assignDelivery(delivery: Delivery, value: string) {
    setFeedback(null)
    try {
      await apiFetch(`/api/deliveries/${delivery.id}/assignee`, {
        method: "PUT",
        body: JSON.stringify({ assigneeId: value ? Number(value) : null }),
      })
      setFeedback({ type: "ok", text: "Entregador designado para a rota." })
      await loadData()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao designar entregador." })
    }
  }

  async function changeStatus(delivery: Delivery, nextStatus: string) {
    if (nextStatus === delivery.status) return
    setFeedback(null)
    let receiverName: string | null = null
    let failureReason: string | null = null

    if (nextStatus === "Entregue") {
      receiverName = window.prompt("Quem recebeu a entrega?", delivery.clientName) ?? null
    }
    if (nextStatus === "Cancelada") {
      failureReason = window.prompt("Motivo do cancelamento:", "") ?? null
    }

    try {
      await apiFetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus, receiverName, failureReason }),
      })
      setFeedback({ type: "ok", text: "Status da entrega atualizado (o app mobile reflete na hora)." })
      await loadData()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao atualizar." })
    }
  }

  async function editDelivery(delivery: Delivery) {
    setFeedback(null)
    const nextCity = window.prompt("Cidade da entrega:", delivery.city ?? "") ?? null
    if (nextCity === null) return
    const nextDate = window.prompt("Data/hora agendada (AAAA-MM-DDTHH:MM):", toDatetimeLocal(delivery.scheduledDate)) ?? null
    if (nextDate === null) return

    try {
      const body: Record<string, string> = {}
      if (nextCity.trim()) body.city = nextCity.trim()
      if (nextDate.trim()) body.scheduledDate = new Date(nextDate).toISOString()
      await apiFetch(`/api/deliveries/${delivery.id}`, { method: "PATCH", body: JSON.stringify(body) })
      setFeedback({ type: "ok", text: "Rota atualizada." })
      await loadData()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao editar rota." })
    }
  }

  if (loading || (user && loadingData)) {
    return (
      <ErpLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      </ErpLayout>
    )
  }

  return (
    <ErpLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Entregas e Rotas</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Gerencie as rotas de entrega que aparecem no aplicativo mobile. Tudo e salvo no mesmo
              banco de dados do ERP.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="default" size="sm">
              <Link href="/vendas/orcamentos/novo">
                <Plus className="size-3.5 mr-1.5" />
                Novo pedido
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Atualizar
            </Button>
          </div>
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
            <h2 className="text-sm font-semibold text-foreground">Nova rota de entrega</h2>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="order">Pedido de venda</Label>
              <select
                id="order"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Selecione o pedido...</option>
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Pedido {o.number} ({o.items.length} item(ns))
                  </option>
                ))}
              </select>
              {availableOrders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum pedido disponivel. Clique em &quot;Novo pedido&quot; acima para criar um
                  (em &quot;Salvar e gerar pedido&quot;) e depois volte aqui para montar a rota.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assignee">Entregador</Label>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Designar depois</option>
                {deliverers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryAddress">Endereco de entrega</Label>
              <Input
                id="deliveryAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, numero, bairro, cidade - UF (ou deixe vazio p/ usar o do cliente)"
              />
              {address.trim() && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Conferir no Google Maps
                </a>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade (opcional)</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="usar a cidade do cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduled">Agendado para (opcional)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={creating || availableOrders.length === 0}>
                {creating ? "Criando..." : "Criar rota"}
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Rastreamento ao vivo</h2>
              {liveOn && liveAt && (
                <span className="text-xs text-muted-foreground">
                  atualizado {liveAt.toLocaleTimeString("pt-BR")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLiveOn(!liveOn)}
              className={
                liveOn
                  ? "rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              }
            >
              {liveOn ? "Parar de acompanhar" : "Acompanhar entregadores"}
            </button>
          </div>

          {liveOn && live.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma rota no momento. Crie uma rota, designe um entregador e
              toque em "Iniciar entrega" no app para o GPS começar a aparecer aqui.
            </p>
          )}

          {liveOn && live.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {live.map((row) => {
                const temSinal = row.latitude != null && row.longitude != null
                const mapsQ = temSinal
                  ? `https://maps.google.com/maps?q=${row.latitude},${row.longitude}&z=15&output=embed`
                  : null
                const rotaLink = temSinal
                  ? `https://www.google.com/maps/dir/?api=1&origin=${row.latitude},${row.longitude}&destination=${encodeURIComponent(row.fullAddress ?? row.clientName)}&travelmode=driving`
                  : null
                return (
                  <div key={row.deliveryId} className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative flex size-2 shrink-0">
                          {temSinal && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                          )}
                          <span
                            className={
                              temSinal
                                ? "relative inline-flex size-2 rounded-full bg-green-500"
                                : "relative inline-flex size-2 rounded-full bg-muted-foreground"
                            }
                          />
                        </span>
                        <span className="truncate text-sm font-semibold">
                          {row.assigneeName ?? "Sem entregador"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{idadeDoPonto(row.recordedAt)}</span>
                        <Badge variant="secondary">{row.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                      {mapsQ ? (
                        <iframe
                          title={`mapa ${row.assigneeName ?? ""}`}
                          src={mapsQ}
                          className="h-44 w-full rounded-md border border-border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-center text-xs text-muted-foreground">
                          {row.status === "Em rota" || row.status === "Pendente"
                            ? "Entregador ainda não enviou posição — aguardando o app iniciar o GPS"
                            : "Rota encerrada"}
                        </div>
                      )}
                      <div className="flex flex-col justify-between gap-2 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{row.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido {row.orderNumber} · {row.route?.length ?? 0} pontos
                          </p>
                          <p className="mt-1 text-xs text-foreground/80">{row.fullAddress ?? "-"}</p>
                        </div>
                        {rotaLink && (
                          <a
                            href={rotaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Navigation className="size-3.5" />
                            Rota do entregador ate o cliente
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Rotas de entrega</h2>
            <Badge variant="secondary">{deliveries.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Pedido</th>
                  <th className="pb-2 pr-4 font-medium">Cliente</th>
                  <th className="pb-2 pr-4 font-medium">Destino</th>
                  <th className="pb-2 pr-4 font-medium">Telefone</th>
                  <th className="pb-2 pr-4 font-medium">Agendado</th>
                  <th className="pb-2 pr-4 font-medium">Entregador</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium text-foreground">#{d.number}</td>
                    <td className="py-2.5 pr-4 text-foreground">{d.clientName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {d.fullAddress ?? d.city ?? "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{d.clientPhone ?? "-"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(d.scheduledDate)}</td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={d.assigneeId ? String(d.assigneeId) : ""}
                        onChange={(e) => assignDelivery(d, e.target.value)}
                        className="h-8 max-w-[180px] rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        <option value="">Sem entregador</option>
                        {deliverers.map((deliverer) => (
                          <option key={deliverer.id} value={deliverer.id}>
                            {deliverer.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={d.status}
                        onChange={(e) => changeStatus(d, e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm font-medium"
                      >
                        {STATUS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        {d.receiverName && (
                          <span className="text-xs text-muted-foreground" title={`Recebido por ${d.receiverName}`}>
                            {d.receiverName}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => editDelivery(d)}>
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      Nenhuma rota de entrega cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpLayout>
  )
}
