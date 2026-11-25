"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Info, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientCreditStatement } from "@/components/receivables/client-credit-statement"
import { SituationBadge } from "@/components/receivables/installment-detail-sheet"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"
import {
  SITUATION_LABELS, brDate, brl, receivablesFetch,
  type DelinquencyRow, type InstallmentRow, type Page, type PaymentsReport, type PeriodReport,
} from "@/src/domain/receivables/receivables"

type Tab = "contas" | "inadimplencia" | "recebimentos" | "extrato" | "previsao" | "vencidas" | "regime"
const TABS: Array<{ id: Tab; label: string }> = [
  { id: "contas", label: "Contas a receber" },
  { id: "inadimplencia", label: "Inadimplencia" },
  { id: "recebimentos", label: "Recebimentos" },
  { id: "extrato", label: "Extrato por cliente" },
  { id: "previsao", label: "Previsao" },
  { id: "vencidas", label: "Parcelas vencidas" },
  { id: "regime", label: "Emissao x Vencimento" },
]

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const today = () => new Date()
const monthStart = () => { const d = today(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)) }
const monthEnd = () => { const d = today(); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
const plusMonths = (n: number) => { const d = today(); return iso(new Date(d.getFullYear(), d.getMonth() + n, d.getDate())) }

function downloadCsv(name: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = [header, ...rows].map((r) => r.map(escape).join(";")).join("\r\n")
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
const num = (v: number | null | undefined) => Number(v ?? 0).toFixed(2).replace(".", ",")

export function ReceivableReportsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = (params.get("aba") as Tab) ?? "contas"
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initial) ? initial : "contas")
  const changeTab = (t: Tab) => { setTab(t); router.replace(`/financeiro/crediario/relatorios?aba=${t}`, { scroll: false }) }

  return (
    <div className="space-y-4 p-6">
      <style>{"@media print { body * { visibility: hidden } #report-print, #report-print * { visibility: visible } #report-print { position: absolute; inset: 0 auto auto 0; width: 100% } .no-print { display: none !important } }"}</style>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Financeiro &gt; Crediario &gt; Relatorios</p>
          <h1 className="text-2xl font-semibold">Relatorios de crediario</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/financeiro/crediario"><ArrowLeft className="size-4" />Crediario</Link></Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />Imprimir</Button>
        </div>
      </div>
      <Tabs value={tab} onValueChange={(v) => changeTab(v as Tab)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {TABS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div id="report-print">
        <h2 className="mb-2 hidden text-lg font-semibold print:block">{TABS.find((t) => t.id === tab)?.label} · emitido em {today().toLocaleString("pt-BR")}</h2>
        {tab === "contas" && <InstallmentsReport />}
        {tab === "vencidas" && <InstallmentsReport fixedSituation="OVERDUE" />}
        {tab === "inadimplencia" && <DelinquencyReport />}
        {tab === "recebimentos" && <PaymentsReportView />}
        {tab === "extrato" && <ClientStatementReport />}
        {tab === "previsao" && <PeriodReportView forecast />}
        {tab === "regime" && <PeriodReportView />}
      </div>
    </div>
  )
}

function CriteriaNote({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><span>{children}</span></p>
}

function InstallmentsReport({ fixedSituation }: { fixedSituation?: "OVERDUE" }) {
  const [f, setF] = useState({ situation: fixedSituation ?? "PENDING", issueFrom: "", issueTo: "", dueFrom: "", dueTo: "" })
  const [data, setData] = useState<Page<InstallmentRow> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    const p = new URLSearchParams({ size: "500" })
    if (f.situation !== "ALL") p.set("situation", f.situation)
    Object.entries(f).forEach(([k, v]) => { if (k !== "situation" && v) p.set(k, v) })
    setError(null)
    receivablesFetch<Page<InstallmentRow>>(`installments?${p}`).then(setData).catch((e) => setError(e.message))
  }, [f])
  useEffect(() => { load() }, [load])
  const rows = data?.items ?? []
  const sum = (k: "amount" | "paidAmount" | "balance") => rows.reduce((s, r) => s + Number(r[k]), 0)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <CriteriaNote>
          {fixedSituation ? "Parcelas que ultrapassaram o vencimento e ainda possuem saldo pendente (dias de atraso contados ate hoje)." : "Titulos gerados (uma linha por parcela). Filtre pela data de emissao (venda) ou pelo vencimento da parcela — sao criterios diferentes."}
        </CriteriaNote>
        <div className="no-print flex flex-wrap items-end gap-3">
          {!fixedSituation && (
            <div className="grid gap-1.5"><Label className="text-xs">Situacao</Label>
              <Select value={f.situation} onValueChange={(v) => setF({ ...f, situation: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  {(["OPEN", "PARTIAL", "OVERDUE", "PAID", "CANCELLED"] as const).map((s) => <SelectItem key={s} value={s}>{SITUATION_LABELS[s]}</SelectItem>)}
                  <SelectItem value="ALL">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Period label="Emissao" from={f.issueFrom} to={f.issueTo} onChange={(a, b) => setF({ ...f, issueFrom: a, issueTo: b })} />
          <Period label="Vencimento" from={f.dueFrom} to={f.dueTo} onChange={(a, b) => setF({ ...f, dueFrom: a, dueTo: b })} />
          <Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv(fixedSituation ? "parcelas-vencidas" : "contas-a-receber",
            ["Cliente", "Documento", "Venda", "Titulo", "Emissao", "Vencimento", "Valor", "Pago", "Saldo", "Situacao", "Dias de atraso"],
            rows.map((r) => [r.clientName, r.clientDocument, r.saleNumber, r.titleCode, brDate(r.issueDate), brDate(r.dueDate), num(r.amount), num(r.paidAmount), num(r.balance), SITUATION_LABELS[r.situation], r.daysOverdue]))}>
            <Download className="size-4" />CSV
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!data ? <Loading /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Venda</TableHead><TableHead>Titulo</TableHead><TableHead>Emissao</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Pago</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situacao</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={9} className="h-20 text-center text-muted-foreground">Nenhum titulo para os filtros.</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.installmentId}><TableCell>{r.clientName}</TableCell><TableCell>#{r.saleNumber}</TableCell><TableCell className="font-mono text-xs">{r.titleCode}</TableCell><TableCell>{brDate(r.issueDate)}</TableCell><TableCell>{brDate(r.dueDate)}</TableCell><TableCell className="text-right">{brl(r.amount)}</TableCell><TableCell className="text-right">{brl(r.paidAmount)}</TableCell><TableCell className="text-right font-medium">{brl(r.balance)}</TableCell><TableCell><SituationBadge row={r} /></TableCell></TableRow>
              ))}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={5}>{rows.length} parcela(s){data.total > rows.length ? ` (exibindo ${rows.length} de ${data.total})` : ""}</TableCell><TableCell className="text-right">{brl(sum("amount"))}</TableCell><TableCell className="text-right">{brl(sum("paidAmount"))}</TableCell><TableCell className="text-right">{brl(sum("balance"))}</TableCell><TableCell /></TableRow></TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function DelinquencyReport() {
  const [rows, setRows] = useState<DelinquencyRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { receivablesFetch<DelinquencyRow[]>("reports/delinquency").then(setRows).catch((e) => setError(e.message)) }, [])
  return (
    <Card><CardContent className="space-y-3 p-4">
      <CriteriaNote>Clientes com ao menos uma parcela vencida e nao paga. Valor em atraso = saldo das parcelas vencidas; dias de atraso contados a partir da parcela vencida mais antiga.</CriteriaNote>
      <div className="no-print flex justify-end"><Button variant="outline" disabled={!rows?.length} onClick={() => downloadCsv("inadimplencia", ["Cliente", "Documento", "Telefone", "Parcelas vencidas", "Valor em atraso", "Vencimento mais antigo", "Dias de atraso", "Saldo total"], (rows ?? []).map((r) => [r.clientName, r.clientDocument, r.phone, r.overdueInstallments, num(r.overdueAmount), brDate(r.oldestDueDate), r.maxDaysOverdue, num(r.totalBalance)]))}><Download className="size-4" />CSV</Button></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!rows ? <Loading /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Parcelas vencidas</TableHead><TableHead className="text-right">Valor em atraso</TableHead><TableHead>Mais antiga</TableHead><TableHead className="text-right">Dias de atraso</TableHead><TableHead className="text-right">Saldo total</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Nenhum cliente inadimplente.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.clientId}><TableCell><Link className="text-primary hover:underline" href={`/cadastros/clientes/${r.clientId}#crediario`}>{r.clientName}</Link><span className="block text-xs text-muted-foreground">{r.clientDocument}</span></TableCell><TableCell>{r.phone ?? "-"}</TableCell><TableCell className="text-right">{r.overdueInstallments}</TableCell><TableCell className="text-right font-medium text-destructive">{brl(r.overdueAmount)}</TableCell><TableCell>{brDate(r.oldestDueDate)}</TableCell><TableCell className="text-right">{r.maxDaysOverdue}</TableCell><TableCell className="text-right">{brl(r.totalBalance)}</TableCell></TableRow>
            ))}
          </TableBody>
          <TableFooter><TableRow><TableCell colSpan={2}>{rows.length} cliente(s)</TableCell><TableCell className="text-right">{rows.reduce((s, r) => s + r.overdueInstallments, 0)}</TableCell><TableCell className="text-right">{brl(rows.reduce((s, r) => s + Number(r.overdueAmount), 0))}</TableCell><TableCell colSpan={2} /><TableCell className="text-right">{brl(rows.reduce((s, r) => s + Number(r.totalBalance), 0))}</TableCell></TableRow></TableFooter>
        </Table>
      )}
    </CardContent></Card>
  )
}

function PaymentsReportView() {
  const [range, setRange] = useState({ from: monthStart(), to: monthEnd() })
  const [data, setData] = useState<PaymentsReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { setData(null); receivablesFetch<PaymentsReport>(`reports/payments?from=${range.from}&to=${range.to}`).then(setData).catch((e) => setError(e.message)) }, [range])
  return (
    <Card><CardContent className="space-y-3 p-4">
      <CriteriaNote>Criterio: <strong>data efetiva do recebimento</strong> (caixa). Estornos aparecem riscados e nao entram nos totais.</CriteriaNote>
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <Period label="Recebido em" from={range.from} to={range.to} onChange={(from, to) => setRange({ from: from || monthStart(), to: to || monthEnd() })} />
        <Button variant="outline" disabled={!data?.payments.length} onClick={() => data && downloadCsv("recebimentos", ["Recebido em", "Cliente", "Venda", "Parcela", "Forma", "Valor", "Situacao", "Usuario", "Observacao"], data.payments.map((p) => [brDate(p.paidAt), p.clientName, p.saleNumber, p.titleCode, p.methodName, num(p.amount), p.status === "ACTIVE" ? "Valido" : "Estornado", p.recordedBy, p.notes]))}><Download className="size-4" />CSV</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!data ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryBox label="Total recebido" value={brl(data.total)} strong />
            <SummaryBox label="Recebimentos" value={String(data.count)} />
            {data.byMethod.map((m) => <SummaryBox key={m.methodCode} label={m.methodName} value={`${brl(m.total)} (${m.count})`} />)}
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Recebido em</TableHead><TableHead>Cliente</TableHead><TableHead>Venda</TableHead><TableHead>Parcela</TableHead><TableHead>Forma</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Usuario</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.payments.length === 0 && <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Nenhum recebimento no periodo.</TableCell></TableRow>}
              {data.payments.map((p) => (
                <TableRow key={p.paymentId} className={p.status === "REVERSED" ? "text-muted-foreground line-through" : ""}><TableCell>{brDate(p.paidAt)}</TableCell><TableCell>{p.clientName}</TableCell><TableCell>#{p.saleNumber}</TableCell><TableCell className="font-mono text-xs">{p.titleCode}</TableCell><TableCell>{p.methodName}</TableCell><TableCell className="text-right">{brl(p.amount)}</TableCell><TableCell className="text-xs">{p.recordedBy}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </CardContent></Card>
  )
}

function ClientStatementReport() {
  const [clients, setClients] = useState<RegisteredClient[]>([])
  const [clientId, setClientId] = useState("")
  const [search, setSearch] = useState("")
  useEffect(() => { fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()).then(setClients).catch(() => undefined) }, [])
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase()
    return t ? clients.filter((c) => `${c.name} ${c.cpf ?? ""} ${c.cnpj ?? ""}`.toLowerCase().includes(t)).slice(0, 50) : clients.slice(0, 50)
  }, [clients, search])
  return (
    <div className="space-y-3">
      <Card className="no-print"><CardContent className="flex flex-wrap items-end gap-3 p-4">
        <div className="grid gap-1.5"><Label className="text-xs">Buscar cliente</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou CPF/CNPJ" className="w-64" /></div>
        <div className="grid gap-1.5"><Label className="text-xs">Cliente</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
            <SelectContent>{filtered.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.cpf || c.cnpj ? ` · ${c.cpf ?? c.cnpj}` : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>
      {clientId ? <ClientCreditStatement key={clientId} clientId={clientId} /> : <p className="py-10 text-center text-sm text-muted-foreground">Selecione um cliente para ver compras, parcelas, pagamentos e saldo devedor.</p>}
    </div>
  )
}

function PeriodReportView({ forecast = false }: { forecast?: boolean }) {
  const [regime, setRegime] = useState<"EMISSAO" | "VENCIMENTO">("VENCIMENTO")
  const [granularity, setGranularity] = useState<"DAY" | "WEEK" | "MONTH">("MONTH")
  const [range, setRange] = useState(forecast ? { from: iso(today()), to: plusMonths(3) } : { from: `${today().getFullYear()}-01-01`, to: `${today().getFullYear()}-12-31` })
  const [data, setData] = useState<PeriodReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const effectiveRegime = forecast ? "VENCIMENTO" : regime
  useEffect(() => {
    setData(null); setError(null)
    receivablesFetch<PeriodReport>(`reports/period?regime=${effectiveRegime}&granularity=${granularity}&from=${range.from}&to=${range.to}`).then(setData).catch((e) => setError(e.message))
  }, [effectiveRegime, granularity, range])

  return (
    <Card><CardContent className="space-y-3 p-4">
      {effectiveRegime === "EMISSAO"
        ? <CriteriaNote><strong>Regime por emissao:</strong> cada titulo entra no periodo em que a <strong>venda foi realizada</strong>, com o valor total financiado (soma das parcelas), independentemente de quando vence ou foi pago.</CriteriaNote>
        : <CriteriaNote><strong>Regime por vencimento (competencia):</strong> cada <strong>parcela</strong> entra no periodo do <strong>seu vencimento</strong>. {forecast ? "Use para prever quanto deve entrar em cada periodo (coluna Pendente)." : ""} &quot;Recebido&quot; e o que ja foi pago dessas parcelas, em qualquer data — para recebimentos pela data efetiva do pagamento, use o relatorio Recebimentos.</CriteriaNote>}
      <div className="no-print flex flex-wrap items-end gap-3">
        {!forecast && (
          <div className="grid gap-1.5"><Label className="text-xs">Criterio</Label>
            <Select value={regime} onValueChange={(v) => setRegime(v as typeof regime)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="EMISSAO">Por emissao (data da venda)</SelectItem><SelectItem value="VENCIMENTO">Por vencimento (competencia)</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-1.5"><Label className="text-xs">Agrupar por</Label>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as typeof granularity)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="DAY">Dia</SelectItem><SelectItem value="WEEK">Semana</SelectItem><SelectItem value="MONTH">Mes</SelectItem></SelectContent>
          </Select>
        </div>
        <Period label={effectiveRegime === "EMISSAO" ? "Emissao" : "Vencimento"} from={range.from} to={range.to} onChange={(from, to) => setRange({ from: from || range.from, to: to || range.to })} />
        <Button variant="outline" disabled={!data?.rows.length} onClick={() => data && downloadCsv(forecast ? "previsao-recebimentos" : `resumo-${effectiveRegime.toLowerCase()}`, ["Periodo", "Titulos", "Parcelas", "Valor", "Recebido", "Pendente", "Vencido"], data.rows.map((r) => [r.label, r.titles, r.installments, num(r.amount), num(r.received), num(r.pending), num(r.overdue)]))}><Download className="size-4" />CSV</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!data ? <Loading /> : (
        <Table>
          <TableHeader><TableRow><TableHead>{effectiveRegime === "EMISSAO" ? "Periodo de emissao" : "Periodo de vencimento"}</TableHead><TableHead className="text-right">Titulos</TableHead><TableHead className="text-right">Parcelas</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Recebido</TableHead><TableHead className="text-right">Pendente</TableHead><TableHead className="text-right">Vencido</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.rows.length === 0 && <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">Sem valores no periodo.</TableCell></TableRow>}
            {data.rows.map((r) => (
              <TableRow key={r.periodStart}><TableCell className="font-medium">{r.label}</TableCell><TableCell className="text-right">{r.titles}</TableCell><TableCell className="text-right">{r.installments}</TableCell><TableCell className="text-right">{brl(r.amount)}</TableCell><TableCell className="text-right text-emerald-700">{brl(r.received)}</TableCell><TableCell className="text-right font-medium">{brl(r.pending)}</TableCell><TableCell className="text-right text-destructive">{brl(r.overdue)}</TableCell></TableRow>
            ))}
          </TableBody>
          <TableFooter><TableRow><TableCell colSpan={3}>Total do periodo</TableCell><TableCell className="text-right">{brl(data.amount)}</TableCell><TableCell className="text-right">{brl(data.received)}</TableCell><TableCell className="text-right">{brl(data.pending)}</TableCell><TableCell className="text-right">{brl(data.overdue)}</TableCell></TableRow></TableFooter>
        </Table>
      )}
    </CardContent></Card>
  )
}

function Period({ label, from, to, onChange }: { label: string; from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="grid gap-1.5"><Label className="text-xs">{label} (de / ate)</Label>
      <div className="flex gap-1"><Input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="w-40" /><Input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="w-40" /></div>
    </div>
  )
}

function SummaryBox({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={strong ? "text-lg font-bold text-primary" : "font-semibold"}>{value}</p></div>
}

function Loading() {
  return <div className="flex h-24 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>
}

