export type PayableStatus = "Pendente" | "Pago" | "Vencido"
export type ReceivableStatus = "Pendente" | "Recebido" | "Vencido"

export interface PayableAccount {
  id: number
  description: string
  supplier: string
  dueDate: string
  value: string
  status: PayableStatus
}

export interface ReceivableAccount {
  id: number
  description: string
  client: string
  dueDate: string
  value: string
  status: ReceivableStatus
}

export interface FinancialSummary {
  totalReceivable: string
  totalPayable: string
  overdue: string
  expectedBalance: string
}
