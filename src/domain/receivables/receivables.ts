/** Tipos do modulo de crediario (espelham os modelos de leitura do backend). */

export type InstallmentSituation = "OPEN" | "PARTIAL" | "PAID" | "CANCELLED" | "OVERDUE"

export interface InstallmentRow {
  installmentId: string
  receivableId: string
  receivableNumber: number
  installmentNumber: number
  installmentCount: number
  titleCode: string
  saleId: string
  saleNumber: number
  clientId: string
  clientName: string
  clientDocument: string | null
  issueDate: string
  dueDate: string
  originalDueDate: string
  originalAmount: number
  amount: number
  paidAmount: number
  balance: number
  status: "OPEN" | "PARTIAL" | "PAID" | "CANCELLED"
  situation: InstallmentSituation
  daysOverdue: number
  paidAt: string | null
  notes: string | null
}

export interface Page<T> { items: T[]; total: number; page: number; size: number }

export interface ReceivableIndicators {
  totalReceivable: number
  totalReceived: number
  totalOverdue: number
  totalOpen: number
  openInstallments: number
  overdueInstallments: number
  delinquentClients: number
  referenceDate: string
}

export interface ReceivablePaymentRow {
  paymentId: string
  installmentId: string
  receivableId: string
  receivableNumber: number
  installmentNumber: number
  titleCode: string
  clientId: string
  clientName: string
  saleNumber: number
  amount: number
  methodCode: string
  methodName: string
  paidAt: string
  recordedAt: string
  recordedBy: string
  notes: string | null
  status: "ACTIVE" | "REVERSED"
  reversedAt: string | null
  reversedBy: string | null
  reverseReason: string | null
}

export interface AuditRow {
  id: number
  action: string
  installmentNumber: number | null
  oldAmount: number | null
  newAmount: number | null
  oldDueDate: string | null
  newDueDate: string | null
  details: string | null
  justification: string | null
  performedBy: string
  performedAt: string
}

export interface ReceivableSummary {
  receivableId: string
  number: number
  saleId: string
  saleNumber: number
  saleStatus: string
  issueDate: string
  saleTotal: number
  downPayment: number
  financedAmount: number
  currentTotal: number
  paidAmount: number
  balance: number
  installmentCount: number
  intervalType: "MONTHLY" | "DAYS"
  intervalDays: number | null
  status: "OPEN" | "PAID" | "CANCELLED"
  createdBy: string
}

export interface ReceivableClientInfo { id: string; name: string; document: string | null; phone: string | null; email: string | null; creditLimit: number | null }

export interface InstallmentDetail {
  installment: InstallmentRow
  receivable: ReceivableSummary
  client: ReceivableClientInfo
  siblings: InstallmentRow[]
  payments: ReceivablePaymentRow[]
  audit: AuditRow[]
}

export interface CreditStatus { clientId: string; creditLimit: number | null; openBalance: number; available: number | null; overdueInstallments: number; overdueAmount: number }

export interface TimelineEvent { at: string; action: string; description: string | null; receivableNumber: number | null; installmentNumber: number | null; delta: number; balanceAfter: number; performedBy: string }

export interface ClientStatement {
  client: ReceivableClientInfo
  totalPurchased: number
  totalPaid: number
  balance: number
  availableCredit: number | null
  openInstallments: number
  overdueInstallments: number
  overdueAmount: number
  nextDue: InstallmentRow[]
  purchases: ReceivableSummary[]
  payments: ReceivablePaymentRow[]
  timeline: TimelineEvent[]
  referenceDate: string
}

export interface DelinquencyRow { clientId: string; clientName: string; clientDocument: string | null; phone: string | null; overdueInstallments: number; overdueAmount: number; oldestDueDate: string; maxDaysOverdue: number; totalBalance: number }
export interface MethodTotal { methodCode: string; methodName: string; count: number; total: number }
export interface PaymentsReport { from: string; to: string; payments: ReceivablePaymentRow[]; byMethod: MethodTotal[]; total: number; count: number }
export interface PeriodRow { periodStart: string; label: string; titles: number; installments: number; amount: number; received: number; pending: number; overdue: number }
export interface PeriodReport { regime: "EMISSAO" | "VENCIMENTO"; granularity: "DAY" | "WEEK" | "MONTH"; from: string; to: string; rows: PeriodRow[]; amount: number; received: number; pending: number; overdue: number }

export const SITUATION_LABELS: Record<InstallmentSituation, string> = {
  OPEN: "Em aberto",
  PARTIAL: "Parcialmente pago",
  PAID: "Pago",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
}

export const SITUATION_STYLES: Record<InstallmentSituation, string> = {
  OPEN: "border-primary/30 bg-primary/10 text-primary",
  PARTIAL: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  OVERDUE: "border-destructive/30 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-muted text-muted-foreground",
}

export const AUDIT_LABELS: Record<string, string> = {
  CREATED: "Crediário gerado",
  PAYMENT: "Recebimento",
  PAYMENT_REVERSED: "Estorno de recebimento",
  DUE_DATE_CHANGED: "Vencimento alterado",
  AMOUNT_CHANGED: "Valor alterado",
  NOTES_CHANGED: "Observação",
  CANCELLED: "Parcela cancelada",
  REOPENED: "Parcela reaberta",
  RECEIVABLE_CANCELLED: "Título cancelado (venda cancelada)",
}

export const brl = (value: number | null | undefined) =>
  Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const brDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("pt-BR") : "-"
export const brDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-"

/** Fetch do crediario com mensagem de erro do backend (o cookie de sessao vai automaticamente). */
export async function receivablesFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/receivables/${path}`, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? `Erro ${response.status}`)
  return data as T
}

/** Previa local das parcelas (mesma regra do backend: centavos restantes nas primeiras parcelas). */
export function previewInstallments(financed: number, count: number, firstDue: string, intervalType: "MONTHLY" | "DAYS", intervalDays: number) {
  const totalCents = Math.round(financed * 100)
  if (!firstDue || count < 1 || totalCents < count) return []
  const base = Math.floor(totalCents / count)
  const remainder = totalCents % count
  const [y, m, d] = firstDue.split("-").map(Number)
  return Array.from({ length: count }, (_, i) => {
    let due: Date
    if (intervalType === "MONTHLY") {
      const target = new Date(y, m - 1 + i, 1)
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
      due = new Date(target.getFullYear(), target.getMonth(), Math.min(d, lastDay))
    } else {
      due = new Date(y, m - 1, d + intervalDays * i)
    }
    return { number: i + 1, dueDate: due, amount: (base + (i < remainder ? 1 : 0)) / 100 }
  })
}
