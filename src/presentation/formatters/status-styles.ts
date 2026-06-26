import type { EntityStatus } from "@/src/domain/shared/status"
import type { PayableStatus, ReceivableStatus } from "@/src/domain/finance/account"
import type { SalesOrderStatus } from "@/src/domain/sales/sales-order"

export function entityStatusClassName(status: EntityStatus) {
  return status === "Ativo"
    ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
    : "bg-muted text-muted-foreground border-border"
}

export function salesOrderStatusClassName(status: SalesOrderStatus) {
  const styles: Record<SalesOrderStatus, string> = {
    Orcamento: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30",
    Faturado: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
    Pendente: "bg-primary/10 text-primary border-primary/30",
    Cancelado: "bg-destructive/10 text-destructive border-destructive/30",
  }

  return styles[status]
}

export function financialStatusClassName(status: PayableStatus | ReceivableStatus) {
  if (status === "Pago" || status === "Recebido") {
    return "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
  }

  if (status === "Vencido") {
    return "bg-destructive/10 text-destructive border-destructive/30"
  }

  return "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30"
}
