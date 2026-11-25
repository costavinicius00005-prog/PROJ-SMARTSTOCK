"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Ban, CalendarDays, CircleDollarSign, Loader2, NotebookPen, Pencil, Receipt, RotateCcw, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AUDIT_LABELS, SITUATION_LABELS, SITUATION_STYLES, brDate, brDateTime, brl, receivablesFetch,
  type InstallmentDetail, type InstallmentRow,
} from "@/src/domain/receivables/receivables"
import type { InstallmentAction } from "@/components/receivables/installment-action-dialog"

export function SituationBadge({ row }: { row: Pick<InstallmentRow, "situation" | "daysOverdue" | "status"> }) {
  return (
    <Badge variant="outline" className={SITUATION_STYLES[row.situation]}>
      {SITUATION_LABELS[row.situation]}
      {row.situation === "OVERDUE" ? ` · ${row.daysOverdue}d` : ""}
      {row.situation === "OVERDUE" && row.status === "PARTIAL" ? " · parcial" : ""}
    </Badge>
  )
}

/** Painel lateral da parcela: dados, cliente, venda de origem, parcelas do titulo, recebimentos e auditoria. */
export function InstallmentDetailSheet({
  installmentId,
  refreshKey,
  canManage,
  onClose,
  onReceive,
  onAction,
}: {
  installmentId: string | null
  refreshKey: number
  canManage: boolean
  onClose: () => void
  onReceive: (row: InstallmentRow) => void
  onAction: (action: InstallmentAction) => void
}) {
  const [detail, setDetail] = useState<InstallmentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (id: string) => {
    setError(null)
    try {
      setDetail(await receivablesFetch<InstallmentDetail>(`installments/${id}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nao foi possivel carregar a parcela.")
    }
  }, [])

  useEffect(() => {
    if (installmentId) load(installmentId)
    else setDetail(null)
  }, [installmentId, refreshKey, load])

  const i = detail?.installment
  const pending = i && (i.status === "OPEN" || i.status === "PARTIAL")

  return (
    <Sheet open={installmentId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">Parcela {i?.titleCode ?? ""} {i && <SituationBadge row={i} />}</SheetTitle>
          <SheetDescription>{detail ? `${detail.client.name} · venda nº ${detail.receivable.saleNumber} · emitida em ${brDate(detail.receivable.issueDate)}` : "Carregando..."}</SheetDescription>
        </SheetHeader>

        {error && <p className="px-4 text-sm text-destructive">{error}</p>}
        {!detail && !error && <div className="flex h-40 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>}

        {detail && i && (
          <div className="space-y-4 px-4 pb-6">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 text-sm sm:grid-cols-4">
              <Info label="Vencimento" value={brDate(i.dueDate)} hint={i.originalDueDate !== i.dueDate ? `original ${brDate(i.originalDueDate)}` : undefined} />
              <Info label="Valor" value={brl(i.amount)} hint={Number(i.originalAmount) !== Number(i.amount) ? `original ${brl(i.originalAmount)}` : undefined} />
              <Info label="Pago" value={brl(i.paidAmount)} hint={i.paidAt ? `quitada em ${brDate(i.paidAt)}` : undefined} />
              <Info label="Saldo" value={brl(i.balance)} strong />
            </div>

            <div className="flex flex-wrap gap-2">
              {pending && <Button size="sm" onClick={() => onReceive(i)}><CircleDollarSign className="size-4" />Receber</Button>}
              {canManage && pending && <Button size="sm" variant="outline" onClick={() => onAction({ kind: "due-date", installment: i })}><CalendarDays className="size-4" />Vencimento</Button>}
              {canManage && i.status === "OPEN" && <Button size="sm" variant="outline" onClick={() => onAction({ kind: "amount", installment: i })}><Pencil className="size-4" />Valor</Button>}
              <Button size="sm" variant="outline" onClick={() => onAction({ kind: "notes", installment: i })}><NotebookPen className="size-4" />Observacao</Button>
              {canManage && i.status === "OPEN" && <Button size="sm" variant="outline" className="text-destructive" onClick={() => onAction({ kind: "cancel", installment: i })}><Ban className="size-4" />Cancelar</Button>}
              {canManage && i.status === "CANCELLED" && detail.receivable.saleStatus !== "CANCELLED" && <Button size="sm" variant="outline" onClick={() => onAction({ kind: "reopen", installment: i })}><RotateCcw className="size-4" />Reabrir</Button>}
              <Button size="sm" variant="ghost" asChild><Link href={`/vendas/comprovante/${detail.receivable.saleId}`} target="_blank"><Receipt className="size-4" />Venda nº {detail.receivable.saleNumber}</Link></Button>
            </div>
            {i.notes && <p className="rounded-md bg-muted px-3 py-2 text-sm"><span className="font-medium">Obs.:</span> {i.notes}</p>}

            <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
                <Link href={`/cadastros/clientes/${detail.client.id}#crediario`} className="font-medium text-primary hover:underline">{detail.client.name}</Link>
                <p className="text-muted-foreground">{detail.client.document ?? "Sem documento"} · {detail.client.phone ?? "sem telefone"}</p>
                <p className="text-muted-foreground">Limite: {detail.client.creditLimit === null ? "sem limite definido" : brl(detail.client.creditLimit)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Titulo nº {detail.receivable.number}</p>
                <p>Venda {brl(detail.receivable.saleTotal)} · entrada {brl(detail.receivable.downPayment)}</p>
                <p>Financiado {brl(detail.receivable.financedAmount)} em {detail.receivable.installmentCount}x ({detail.receivable.intervalType === "MONTHLY" ? "mensal" : `a cada ${detail.receivable.intervalDays} dias`})</p>
                <p className="text-muted-foreground">Pago {brl(detail.receivable.paidAmount)} · saldo {brl(detail.receivable.balance)} · por {detail.receivable.createdBy}</p>
              </div>
            </div>

            <Tabs defaultValue="installments">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="installments">Parcelas ({detail.siblings.length})</TabsTrigger>
                <TabsTrigger value="payments">Recebimentos ({detail.payments.length})</TabsTrigger>
                <TabsTrigger value="audit">Historico ({detail.audit.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="installments">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5">Parcela</th><th>Vencimento</th><th className="text-right">Valor</th><th className="text-right">Saldo</th><th className="pl-2">Situacao</th></tr></thead>
                  <tbody>{detail.siblings.map((s) => (
                    <tr key={s.installmentId} className={`border-b last:border-0 ${s.installmentId === i.installmentId ? "bg-primary/5 font-medium" : ""}`}>
                      <td className="py-1.5">{s.installmentNumber}/{s.installmentCount}</td><td>{brDate(s.dueDate)}</td><td className="text-right">{brl(s.amount)}</td><td className="text-right">{brl(s.balance)}</td><td className="pl-2"><SituationBadge row={s} /></td>
                    </tr>))}</tbody>
                </table>
              </TabsContent>
              <TabsContent value="payments">
                {detail.payments.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum recebimento nesta parcela.</p> : (
                  <ul className="divide-y text-sm">{detail.payments.map((p) => (
                    <li key={p.paymentId} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className={p.status === "REVERSED" ? "text-muted-foreground line-through" : "font-medium"}>{brl(p.amount)} · {p.methodName}</p>
                        <p className="text-xs text-muted-foreground">Recebido em {brDate(p.paidAt)} · lancado por {p.recordedBy} em {brDateTime(p.recordedAt)}</p>
                        {p.notes && <p className="text-xs text-muted-foreground">Obs.: {p.notes}</p>}
                        {p.status === "REVERSED" && <p className="text-xs text-destructive">Estornado por {p.reversedBy} em {brDateTime(p.reversedAt)} — {p.reverseReason}</p>}
                      </div>
                      {canManage && p.status === "ACTIVE" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onAction({ kind: "reverse", installment: i, payment: p })}><Undo2 className="size-4" />Estornar</Button>}
                    </li>))}</ul>
                )}
              </TabsContent>
              <TabsContent value="audit">
                <ul className="space-y-2 text-sm">{detail.audit.slice().reverse().map((a) => (
                  <li key={a.id} className="rounded-md border px-3 py-2">
                    <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}{a.installmentNumber ? ` · parcela ${a.installmentNumber}` : ""}</span><span className="text-xs text-muted-foreground">{brDateTime(a.performedAt)} · {a.performedBy}</span></div>
                    {a.action === "AMOUNT_CHANGED" && <p className="text-xs">Valor: {brl(a.oldAmount)} → {brl(a.newAmount)}</p>}
                    {a.action === "DUE_DATE_CHANGED" && <p className="text-xs">Vencimento: {brDate(a.oldDueDate)} → {brDate(a.newDueDate)}</p>}
                    {a.details && a.action !== "AMOUNT_CHANGED" && a.action !== "DUE_DATE_CHANGED" && <p className="text-xs text-muted-foreground">{a.details}</p>}
                    {a.justification && <p className="text-xs">Justificativa: {a.justification}</p>}
                  </li>))}</ul>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Info({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? "text-base font-semibold text-primary" : "font-medium"}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
