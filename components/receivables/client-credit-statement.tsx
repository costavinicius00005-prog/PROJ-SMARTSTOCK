"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, CircleDollarSign, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReceivePaymentDialog } from "@/components/receivables/receive-payment-dialog"
import { SituationBadge } from "@/components/receivables/installment-detail-sheet"
import type { PaymentMethod } from "@/src/domain/sales/checkout"
import {
  AUDIT_LABELS, brDate, brDateTime, brl, receivablesFetch,
  type ClientStatement, type InstallmentRow, type ReceivableSummary,
} from "@/src/domain/receivables/receivables"

/** Ficha financeira (crediario) do cliente: totais, proximos vencimentos, compras, pagamentos e linha do tempo. */
export function ClientCreditStatement({ clientId }: { clientId: string }) {
  const [statement, setStatement] = useState<ClientStatement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [receiving, setReceiving] = useState<InstallmentRow | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saleInstallments, setSaleInstallments] = useState<Record<string, InstallmentRow[]>>({})

  const load = useCallback(() => {
    setError(null)
    receivablesFetch<ClientStatement>(`clients/${clientId}/statement`).then(setStatement).catch((e) => setError(e instanceof Error ? e.message : "Nao foi possivel carregar a ficha financeira."))
    setSaleInstallments({})
  }, [clientId])

  useEffect(() => {
    load()
    fetch("/api/sales/checkout/payment-methods", { cache: "no-store" }).then((r) => r.json()).then(setMethods).catch(() => undefined)
  }, [load])

  async function toggle(purchase: ReceivableSummary) {
    if (expanded === purchase.receivableId) return setExpanded(null)
    setExpanded(purchase.receivableId)
    if (!saleInstallments[purchase.receivableId]) {
      const detail = await receivablesFetch<{ installments: InstallmentRow[] }>(`sales/${purchase.saleId}`).catch(() => null)
      if (detail) setSaleInstallments((s) => ({ ...s, [purchase.receivableId]: detail.installments }))
    }
  }

  return (
    <Card id="crediario" className="scroll-mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Ficha financeira · Crediario</CardTitle>
        {statement && <span className="text-xs text-muted-foreground">Posicao em {brDate(statement.referenceDate)}</span>}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!statement && !error && <div className="flex h-24 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>}
        {statement && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Comprado no crediario" value={brl(statement.totalPurchased)} />
              <Stat label="Total pago" value={brl(statement.totalPaid)} tone="text-emerald-600" />
              <Stat label="Saldo devedor" value={brl(statement.balance)} tone="text-primary" />
              <Stat label="Credito disponivel" value={statement.availableCredit === null ? "Sem limite" : brl(statement.availableCredit)} />
              <Stat label="Parcelas em aberto" value={String(statement.openInstallments)} />
              <Stat label="Parcelas vencidas" value={`${statement.overdueInstallments}${statement.overdueInstallments ? ` · ${brl(statement.overdueAmount)}` : ""}`} tone={statement.overdueInstallments ? "text-destructive" : undefined} />
            </div>

            <Tabs defaultValue="next">
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="next">Proximos vencimentos ({statement.nextDue.length})</TabsTrigger>
                <TabsTrigger value="purchases">Compras no crediario ({statement.purchases.length})</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos ({statement.payments.length})</TabsTrigger>
                <TabsTrigger value="timeline">Extrato cronologico</TabsTrigger>
              </TabsList>

              <TabsContent value="next">
                {statement.nextDue.length === 0 ? <Empty text="Nenhuma parcela em aberto." /> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5">Parcela</th><th>Venda</th><th>Vencimento</th><th className="text-right">Saldo</th><th className="pl-3">Situacao</th><th /></tr></thead>
                    <tbody>{statement.nextDue.map((i) => (
                      <tr key={i.installmentId} className="border-b last:border-0">
                        <td className="py-1.5 font-mono text-xs">{i.titleCode}</td><td>#{i.saleNumber}</td><td>{brDate(i.dueDate)}</td><td className="text-right font-medium">{brl(i.balance)}</td><td className="pl-3"><SituationBadge row={i} /></td>
                        <td className="text-right"><Button size="sm" variant="outline" onClick={() => setReceiving(i)}><CircleDollarSign className="size-4" />Receber</Button></td>
                      </tr>))}</tbody>
                  </table>
                )}
              </TabsContent>

              <TabsContent value="purchases">
                {statement.purchases.length === 0 ? <Empty text="Este cliente ainda nao comprou no crediario." /> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5" /><th>Titulo</th><th>Venda</th><th>Emissao</th><th className="text-right">Venda</th><th className="text-right">Entrada</th><th className="text-right">Financiado</th><th className="text-right">Pago</th><th className="text-right">Saldo</th><th className="pl-3">Situacao</th></tr></thead>
                    <tbody>{statement.purchases.map((p) => (
                      <Fragment key={p.receivableId}>
                        <tr className="cursor-pointer border-b hover:bg-muted/40" onClick={() => toggle(p)}>
                          <td className="py-1.5">{expanded === p.receivableId ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</td>
                          <td>nº {p.number}</td><td><Link href={`/vendas/comprovante/${p.saleId}`} target="_blank" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>#{p.saleNumber}</Link></td>
                          <td>{brDate(p.issueDate)}</td><td className="text-right">{brl(p.saleTotal)}</td><td className="text-right">{brl(p.downPayment)}</td><td className="text-right">{brl(p.financedAmount)} <span className="text-xs text-muted-foreground">({p.installmentCount}x)</span></td>
                          <td className="text-right">{brl(p.paidAmount)}</td><td className="text-right font-medium">{brl(p.balance)}</td>
                          <td className="pl-3"><Badge variant="outline">{p.status === "PAID" ? "Quitado" : p.status === "CANCELLED" ? "Cancelado" : "Em aberto"}</Badge></td>
                        </tr>
                        {expanded === p.receivableId && (
                          <tr className="border-b bg-muted/30"><td colSpan={10} className="px-6 py-2">
                            {!saleInstallments[p.receivableId] ? <Loader2 className="size-4 animate-spin" /> : (
                              <div className="grid gap-1">{saleInstallments[p.receivableId].map((i) => (
                                <div key={i.installmentId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <span className="font-mono">{i.titleCode}</span><span>venc. {brDate(i.dueDate)}</span><span>valor {brl(i.amount)}</span><span>pago {brl(i.paidAmount)}</span><span className="font-medium">saldo {brl(i.balance)}</span><SituationBadge row={i} />
                                </div>))}</div>
                            )}
                          </td></tr>
                        )}
                      </Fragment>
                    ))}</tbody>
                  </table>
                )}
              </TabsContent>

              <TabsContent value="payments">
                {statement.payments.length === 0 ? <Empty text="Nenhum pagamento registrado." /> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5">Recebido em</th><th>Parcela</th><th>Forma</th><th className="text-right">Valor</th><th className="pl-3">Lancado por</th><th>Situacao</th></tr></thead>
                    <tbody>{statement.payments.map((p) => (
                      <tr key={p.paymentId} className="border-b last:border-0">
                        <td className="py-1.5">{brDate(p.paidAt)}</td><td className="font-mono text-xs">{p.titleCode}</td><td>{p.methodName}</td>
                        <td className={`text-right ${p.status === "REVERSED" ? "text-muted-foreground line-through" : "font-medium"}`}>{brl(p.amount)}</td>
                        <td className="pl-3 text-xs text-muted-foreground">{p.recordedBy} · {brDateTime(p.recordedAt)}</td>
                        <td>{p.status === "REVERSED" ? <Badge variant="destructive">Estornado</Badge> : <Badge variant="outline">Valido</Badge>}</td>
                      </tr>))}</tbody>
                  </table>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                {statement.timeline.length === 0 ? <Empty text="Sem movimentacoes financeiras." /> : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5">Data/hora</th><th>Operacao</th><th>Titulo</th><th className="text-right">Efeito no saldo</th><th className="text-right">Saldo devedor</th><th className="pl-3">Usuario</th></tr></thead>
                    <tbody>{statement.timeline.map((t, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-1.5 text-xs">{brDateTime(t.at)}</td>
                        <td><span className="font-medium">{AUDIT_LABELS[t.action] ?? t.action}</span>{t.description && <span className="block text-xs text-muted-foreground">{t.description}</span>}</td>
                        <td className="text-xs">{t.receivableNumber ? `nº ${t.receivableNumber}${t.installmentNumber ? ` · parc. ${t.installmentNumber}` : ""}` : "-"}</td>
                        <td className={`text-right ${Number(t.delta) > 0 ? "text-destructive" : Number(t.delta) < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>{Number(t.delta) === 0 ? "-" : `${Number(t.delta) > 0 ? "+" : ""}${brl(t.delta)}`}</td>
                        <td className="text-right font-medium">{brl(t.balanceAfter)}</td>
                        <td className="pl-3 text-xs text-muted-foreground">{t.performedBy}</td>
                      </tr>))}</tbody>
                  </table>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
        <ReceivePaymentDialog installment={receiving} methods={methods} onClose={() => setReceiving(null)} onReceived={load} />
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-0.5 text-base font-semibold ${tone ?? "text-foreground"}`}>{value}</p></div>
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
}
