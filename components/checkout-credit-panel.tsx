"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CalendarClock, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PaymentMethod } from "@/src/domain/sales/checkout"
import { brl, previewInstallments, receivablesFetch, type CreditStatus } from "@/src/domain/receivables/receivables"

export interface CreditPlanState {
  installments: number
  intervalType: "MONTHLY" | "DAYS"
  intervalDays: number
  firstDueDate: string
}

export const defaultCreditPlan = (): CreditPlanState => {
  const due = new Date()
  due.setMonth(due.getMonth() + 1)
  return { installments: 1, intervalType: "MONTHLY", intervalDays: 30, firstDueDate: toIso(due) }
}

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/**
 * Configuracao do crediario no caixa: cliente obrigatorio, situacao de credito, entrada,
 * parcelas/intervalo/primeiro vencimento e previa das parcelas. Os valores finais sao validados
 * novamente no backend (limite de credito, datas, soma exata, arredondamento).
 */
export function CheckoutCreditPanel({
  clientId,
  financed,
  total,
  plan,
  onPlanChange,
  methods,
  onApplyDownPayment,
  onStatusChange,
  disabled,
}: {
  clientId: string | null
  financed: number
  total: number
  plan: CreditPlanState
  onPlanChange: (plan: CreditPlanState) => void
  methods: PaymentMethod[]
  onApplyDownPayment: (amount: number, methodId: string) => void
  onStatusChange: (problem: string | null) => void
  disabled?: boolean
}) {
  const [status, setStatus] = useState<CreditStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const downMethods = methods.filter((m) => !m.allowsCredit)
  const [downValue, setDownValue] = useState(0)
  const [downMethod, setDownMethod] = useState(downMethods[0]?.id ?? "")

  useEffect(() => {
    if (!downMethod && downMethods[0]) setDownMethod(downMethods[0].id)
  }, [downMethods, downMethod])

  useEffect(() => {
    setStatus(null)
    setStatusError(null)
    if (!clientId) return
    setLoadingStatus(true)
    receivablesFetch<CreditStatus>(`clients/${clientId}/credit-status`)
      .then(setStatus)
      .catch((e) => setStatusError(e instanceof Error ? e.message : "Nao foi possivel consultar o credito do cliente."))
      .finally(() => setLoadingStatus(false))
  }, [clientId])

  const preview = useMemo(
    () => previewInstallments(financed, plan.installments, plan.firstDueDate, plan.intervalType, plan.intervalDays),
    [financed, plan],
  )

  const today = toIso(new Date())
  const problem = !clientId
    ? "Selecione um cliente cadastrado para vender no crediario."
    : statusError
      ? statusError
      : plan.installments < 1 || plan.installments > 60
        ? "A quantidade de parcelas deve ser entre 1 e 60."
        : plan.intervalType === "DAYS" && (plan.intervalDays < 1 || plan.intervalDays > 365)
          ? "O intervalo deve ser entre 1 e 365 dias."
          : !plan.firstDueDate || plan.firstDueDate < today
            ? "O primeiro vencimento nao pode ser anterior a hoje."
            : financed > 0 && preview.length === 0
              ? "Valor insuficiente para essa quantidade de parcelas."
              : status && status.available !== null && financed > status.available + 0.0001
                ? `Limite de credito excedido: disponivel ${brl(status.available)}.`
                : null

  useEffect(() => onStatusChange(problem), [problem, onStatusChange])

  const update = (patch: Partial<CreditPlanState>) => onPlanChange({ ...plan, ...patch })

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarClock className="size-4 text-primary" />
          Crediario · {brl(financed)} a prazo
        </p>
        {loadingStatus ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : status ? (
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Badge variant="outline">Limite: {status.creditLimit === null ? "sem limite" : brl(status.creditLimit)}</Badge>
            <Badge variant="outline">Em aberto: {brl(status.openBalance)}</Badge>
            {status.available !== null && <Badge variant="outline">Disponivel: {brl(status.available)}</Badge>}
          </div>
        ) : null}
      </div>

      {status && status.overdueInstallments > 0 && (
        <p className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-800">
          <AlertTriangle className="size-3.5" />
          Cliente com {status.overdueInstallments} parcela(s) vencida(s) somando {brl(status.overdueAmount)}.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label className="text-xs">Entrada (opcional)</Label>
          <Input type="number" min="0" step="0.01" value={downValue || ""} disabled={disabled} onChange={(e) => setDownValue(Number(e.target.value))} placeholder="0,00" />
        </div>
        <div>
          <Label className="text-xs">Forma da entrada</Label>
          <Select value={downMethod} onValueChange={setDownMethod} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{downMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-9" disabled={disabled || !downMethod || downValue < 0 || downValue >= total}
          onClick={() => onApplyDownPayment(Math.round(downValue * 100) / 100, downMethod)}>
          Aplicar entrada
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Parcelas</Label>
          <Input type="number" min="1" max="60" value={plan.installments} disabled={disabled} onChange={(e) => update({ installments: Math.max(1, Math.min(60, Math.trunc(Number(e.target.value) || 1))) })} />
        </div>
        <div>
          <Label className="text-xs">Intervalo</Label>
          <Select value={plan.intervalType} onValueChange={(v) => update({ intervalType: v as CreditPlanState["intervalType"] })} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Mensal</SelectItem>
              <SelectItem value="DAYS">A cada N dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Dias entre parcelas</Label>
          <Input type="number" min="1" max="365" value={plan.intervalDays} disabled={disabled || plan.intervalType !== "DAYS"} onChange={(e) => update({ intervalDays: Math.trunc(Number(e.target.value) || 0) })} />
        </div>
        <div>
          <Label className="text-xs">1º vencimento</Label>
          <Input type="date" min={today} value={plan.firstDueDate} disabled={disabled} onChange={(e) => update({ firstDueDate: e.target.value })} />
        </div>
      </div>

      {preview.length > 0 && (
        <div className="max-h-44 overflow-y-auto rounded-md border bg-card">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr><th className="px-2 py-1 text-left font-medium">Parcela</th><th className="px-2 py-1 text-left font-medium">Vencimento</th><th className="px-2 py-1 text-right font-medium">Valor</th></tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.number} className="border-t">
                  <td className="px-2 py-1">{p.number}/{preview.length}</td>
                  <td className="px-2 py-1">{p.dueDate.toLocaleDateString("pt-BR")}</td>
                  <td className="px-2 py-1 text-right font-medium">{brl(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {problem && <p className="text-sm font-medium text-destructive">{problem}</p>}
    </div>
  )
}
