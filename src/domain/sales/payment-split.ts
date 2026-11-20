import type { PaymentMethod } from "@/src/domain/sales/checkout"

/** Uma linha de pagamento no caixa: forma escolhida + valor entregue pelo cliente. */
export interface PaymentLine {
  key: string
  methodId: string
  value: number
}

export interface PaymentPayload {
  paymentMethodId: string
  amount: number
  receivedAmount: number
  installments: number
}

export interface PaymentSplit {
  /** Soma dos valores informados (o que o cliente entregou). */
  paid: number
  /** Quanto ainda falta para cobrir o total. */
  remaining: number
  /** Troco a devolver (so existe quando ha dinheiro ou outra forma que aceite troco). */
  change: number
  /** Problema que impede a finalizacao, se houver. */
  error: string | null
  canFinish: boolean
  payments: PaymentPayload[]
}

const toCents = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100)
const fromCents = (value: number) => value / 100

/**
 * Distribui o total da venda entre as formas de pagamento informadas.
 * - Cartao/PIX (sem troco) nunca podem ultrapassar o total.
 * - O excedente so pode vir de formas que aceitam troco (dinheiro) e vira troco:
 *   o valor aplicado na venda e (total - outras formas) e o valor recebido e o entregue.
 * - A soma dos valores aplicados e sempre exatamente o total quando canFinish = true.
 * Todos os calculos sao feitos em centavos para evitar erros de arredondamento.
 */
export function splitPayments(lines: PaymentLine[], methods: PaymentMethod[], total: number): PaymentSplit {
  const totalCents = toCents(total)
  const byId = new Map(methods.map((method) => [method.id, method]))
  const empty = { paid: 0, remaining: fromCents(totalCents), change: 0, canFinish: false, payments: [] }

  if (lines.length === 0) return { ...empty, error: null }
  if (lines.some((line) => !byId.has(line.methodId))) return { ...empty, error: "Selecione a forma de pagamento de cada linha." }
  if (lines.some((line) => toCents(line.value) <= 0)) {
    const paid = lines.reduce((sum, line) => sum + Math.max(0, toCents(line.value)), 0)
    return { ...empty, paid: fromCents(paid), remaining: fromCents(Math.max(0, totalCents - paid)), error: "Informe um valor maior que zero em cada forma de pagamento." }
  }

  const withChange = lines.filter((line) => byId.get(line.methodId)!.allowsChange)
  const withoutChange = lines.filter((line) => !byId.get(line.methodId)!.allowsChange)
  const exactCents = withoutChange.reduce((sum, line) => sum + toCents(line.value), 0)
  const changeableCents = withChange.reduce((sum, line) => sum + toCents(line.value), 0)
  const paidCents = exactCents + changeableCents
  const remainingCents = Math.max(0, totalCents - paidCents)
  const changeCents = Math.max(0, paidCents - totalCents)
  const base = { paid: fromCents(paidCents), remaining: fromCents(remainingCents), change: fromCents(changeCents) }

  if (exactCents > totalCents) {
    return { ...base, change: 0, canFinish: false, payments: [], error: "Pagamentos sem troco (cartao, PIX...) ultrapassam o total da venda." }
  }

  // Quanto o dinheiro precisa cobrir; distribui na ordem das linhas, o resto e troco
  let neededFromChangeable = totalCents - exactCents
  const payments: PaymentPayload[] = []
  for (const line of lines) {
    const valueCents = toCents(line.value)
    if (!byId.get(line.methodId)!.allowsChange) {
      payments.push({ paymentMethodId: line.methodId, amount: fromCents(valueCents), receivedAmount: fromCents(valueCents), installments: 1 })
      continue
    }
    const applied = Math.min(valueCents, Math.max(0, neededFromChangeable))
    neededFromChangeable -= applied
    if (applied === 0) {
      return { ...base, canFinish: false, payments: [], error: "Ha dinheiro sobrando que nao e necessario para a venda. Ajuste ou remova essa linha." }
    }
    payments.push({ paymentMethodId: line.methodId, amount: fromCents(applied), receivedAmount: fromCents(valueCents), installments: 1 })
  }

  const canFinish = remainingCents === 0 && totalCents > 0
  return { ...base, canFinish, payments: canFinish ? payments : [], error: null }
}
