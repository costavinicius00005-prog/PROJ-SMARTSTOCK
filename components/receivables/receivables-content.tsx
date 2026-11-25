"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, BarChart3, ChevronLeft, ChevronRight, CircleDollarSign, Clock, FilterX, HandCoins, Loader2, RefreshCw, Search, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InstallmentDetailSheet, SituationBadge } from "@/components/receivables/installment-detail-sheet"
import { InstallmentActionDialog, type InstallmentAction } from "@/components/receivables/installment-action-dialog"
import { ReceivePaymentDialog } from "@/components/receivables/receive-payment-dialog"
import type { PaymentMethod } from "@/src/domain/sales/checkout"
import { brDate, brl, receivablesFetch, type InstallmentRow, type Page, type ReceivableIndicators } from "@/src/domain/receivables/receivables"

type Filters = { q: string; situation: string; issueFrom: string; issueTo: string; dueFrom: string; dueTo: string; saleNumber: string; receivableNumber: string }
const EMPTY: Filters = { q: "", situation: "PENDING", issueFrom: "", issueTo: "", dueFrom: "", dueTo: "", saleNumber: "", receivableNumber: "" }
const PAGE_SIZE = 50

export function ReceivablesContent() {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [debouncedQ, setDebouncedQ] = useState("")
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<InstallmentRow> | null>(null)
  const [indicators, setIndicators] = useState<ReceivableIndicators | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [permissions, setPermissions] = useState<{ receive: boolean; manage: boolean }>({ receive: false, manage: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [receiving, setReceiving] = useState<InstallmentRow | null>(null)
  const [action, setAction] = useState<InstallmentAction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(filters.q), 300); return () => clearTimeout(t) }, [filters.q])
  useEffect(() => { setPage(0) }, [debouncedQ, filters.situation, filters.issueFrom, filters.issueTo, filters.dueFrom, filters.dueTo, filters.saleNumber, filters.receivableNumber])

  useEffect(() => {
    fetch("/api/sales/checkout/payment-methods", { cache: "no-store" }).then((r) => r.json()).then(setMethods).catch(() => undefined)
    receivablesFetch<{ receive: boolean; manage: boolean }>("permissions").then(setPermissions).catch(() => undefined)
  }, [])

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim())
    if (filters.situation && filters.situation !== "ALL") p.set("situation", filters.situation)
    for (const key of ["issueFrom", "issueTo", "dueFrom", "dueTo", "saleNumber", "receivableNumber"] as const) if (filters[key]) p.set(key, filters[key])
    return p.toString()
  }, [debouncedQ, filters, page])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, ind] = await Promise.all([
        receivablesFetch<Page<InstallmentRow>>(`installments?${query}`),
        receivablesFetch<ReceivableIndicators>("indicators"),
      ])
      setData(list)
      setIndicators(ind)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nao foi possivel carregar o crediario.")
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { load() }, [load])
  const afterChange = () => { load(); setRefreshKey((k) => k + 1) }
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Financeiro &gt; Crediario</p>
          <h1 className="text-2xl font-semibold">Crediario</h1>
          <p className="text-sm text-muted-foreground">Titulos a receber das vendas a prazo. Situacoes calculadas em {indicators ? brDate(indicators.referenceDate) : "..."}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/financeiro/crediario/relatorios"><BarChart3 className="size-4" />Relatorios</Link></Button>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Indicator icon={Wallet} label="Total a receber" value={brl(indicators?.totalReceivable)} hint={`${indicators?.openInstallments ?? 0} parcelas`} onClick={() => set({ situation: "PENDING" })} active={filters.situation === "PENDING"} />
        <Indicator icon={Clock} label="Em aberto (a vencer)" value={brl(indicators?.totalOpen)} onClick={() => set({ situation: "OPEN" })} active={filters.situation === "OPEN"} />
        <Indicator icon={AlertTriangle} tone="danger" label="Total vencido" value={brl(indicators?.totalOverdue)} hint={`${indicators?.overdueInstallments ?? 0} parcelas vencidas`} onClick={() => set({ situation: "OVERDUE" })} active={filters.situation === "OVERDUE"} />
        <Indicator icon={AlertTriangle} tone="danger" label="Parcelas vencidas" value={String(indicators?.overdueInstallments ?? 0)} onClick={() => set({ situation: "OVERDUE" })} />
        <Indicator icon={Users} tone="danger" label="Clientes inadimplentes" value={String(indicators?.delinquentClients ?? 0)} href="/financeiro/crediario/relatorios?aba=inadimplencia" />
        <Indicator icon={HandCoins} tone="success" label="Total recebido" value={brl(indicators?.totalReceived)} onClick={() => set({ situation: "PAID" })} active={filters.situation === "PAID"} />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr_auto] xl:items-end">
          <div className="grid gap-1.5">
            <Label className="text-xs">Busca rapida</Label>
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Cliente, CPF/CNPJ, nº do titulo ou da venda" className="pl-9" /></div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Situacao</Label>
            <Select value={filters.situation} onValueChange={(v) => set({ situation: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendentes (com saldo)</SelectItem>
                <SelectItem value="OPEN">Em aberto (a vencer)</SelectItem>
                <SelectItem value="PARTIAL">Parcialmente pago</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="ALL">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DateRange label="Emissao" from={filters.issueFrom} to={filters.issueTo} onChange={(from, to) => set({ issueFrom: from, issueTo: to })} />
          <DateRange label="Vencimento" from={filters.dueFrom} to={filters.dueTo} onChange={(from, to) => set({ dueFrom: from, dueTo: to })} />
          <div className="grid gap-1.5"><Label className="text-xs">Nº venda</Label><Input inputMode="numeric" value={filters.saleNumber} onChange={(e) => set({ saleNumber: e.target.value.replace(/\D/g, "") })} /></div>
          <div className="grid gap-1.5"><Label className="text-xs">Nº titulo</Label><Input inputMode="numeric" value={filters.receivableNumber} onChange={(e) => set({ receivableNumber: e.target.value.replace(/\D/g, "") })} /></div>
          <Button variant="ghost" onClick={() => setFilters(EMPTY)} title="Limpar filtros"><FilterX className="size-4" />Limpar</Button>
        </CardContent>
      </Card>

      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Parcelas {data ? `(${data.total})` : ""}</CardTitle>
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="pl-4">Cliente</TableHead><TableHead>Venda</TableHead><TableHead>Titulo</TableHead><TableHead>Emissao</TableHead><TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Pago</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situacao</TableHead><TableHead className="pr-4 text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.items.length === 0 && <TableRow><TableCell colSpan={10} className="h-28 text-center text-muted-foreground">Nenhuma parcela encontrada para os filtros.</TableCell></TableRow>}
                {data?.items.map((row) => (
                  <TableRow key={row.installmentId} className="cursor-pointer" onClick={() => setSelected(row.installmentId)}>
                    <TableCell className="pl-4"><p className="font-medium">{row.clientName}</p><p className="text-xs text-muted-foreground">{row.clientDocument ?? ""}</p></TableCell>
                    <TableCell>#{row.saleNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{row.titleCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{brDate(row.issueDate)}</TableCell>
                    <TableCell className={`whitespace-nowrap ${row.situation === "OVERDUE" ? "font-medium text-destructive" : ""}`}>{brDate(row.dueDate)}</TableCell>
                    <TableCell className="text-right">{brl(row.amount)}{Number(row.originalAmount) !== Number(row.amount) && <span className="block text-[11px] text-muted-foreground line-through">{brl(row.originalAmount)}</span>}</TableCell>
                    <TableCell className="text-right">{brl(row.paidAmount)}</TableCell>
                    <TableCell className="text-right font-semibold">{brl(row.balance)}</TableCell>
                    <TableCell><SituationBadge row={row} /></TableCell>
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {(row.status === "OPEN" || row.status === "PARTIAL") && permissions.receive
                        ? <Button size="sm" onClick={() => setReceiving(row)}><CircleDollarSign className="size-4" />Receber</Button>
                        : <Button size="sm" variant="ghost" onClick={() => setSelected(row.installmentId)}>Detalhes</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
            <span>Pagina {page + 1} de {totalPages}</span>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label="Pagina anterior" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Proxima pagina" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <InstallmentDetailSheet installmentId={selected} refreshKey={refreshKey} canManage={permissions.manage} onClose={() => setSelected(null)} onReceive={setReceiving} onAction={setAction} />
      <ReceivePaymentDialog installment={receiving} methods={methods} onClose={() => setReceiving(null)} onReceived={afterChange} />
      <InstallmentActionDialog action={action} onClose={() => setAction(null)} onDone={afterChange} />
    </div>
  )
}

function Indicator({ icon: Icon, label, value, hint, tone, onClick, href, active }: { icon: typeof Wallet; label: string; value: string; hint?: string; tone?: "danger" | "success"; onClick?: () => void; href?: string; active?: boolean }) {
  const color = tone === "danger" ? "text-destructive" : tone === "success" ? "text-emerald-600" : "text-foreground"
  const body = (
    <Card className={`h-full transition-colors hover:border-primary/50 ${active ? "border-primary ring-1 ring-primary/30" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><Icon className={`size-4 ${color}`} /></div>
        <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
  if (href) return <Link href={href} className="block">{body}</Link>
  return <button type="button" onClick={onClick} className="text-left">{body}</button>
}

function DateRange({ label, from, to, onChange }: { label: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label} (de / ate)</Label>
      <div className="grid grid-cols-2 gap-1">
        <Input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="px-2 text-xs" />
        <Input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="px-2 text-xs" />
      </div>
    </div>
  )
}
