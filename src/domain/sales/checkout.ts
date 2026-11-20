import type { SalesDocumentItem } from "@/src/domain/sales/sales-document"
export interface PaymentMethod { id: string; code: string; name: string; kind: string; allowsChange: boolean; allowsCredit: boolean }
export interface CompletedSale { id: string; number: number; source: "DIRECT_SALE" | "SALES_ORDER"; total: number; items: SalesDocumentItem[] }
export interface CompleteSalePayload { salesOrderId: string | null; clientId: string | null; generalDiscount: number; notes: string; items: Array<{ productId: string; quantity: number; discount: number }>; payments: Array<{ paymentMethodId: string; amount: number; receivedAmount: number; installments: number }>; requestId: string }

export interface SaleReceiptPayment {
  methodCode: string
  methodName: string
  amount: number
  receivedAmount: number
  changeAmount: number
  installments: number
}

/** Venda exatamente como gravada no banco (base do comprovante; nada e recalculado). */
export interface SaleReceipt {
  id: string
  number: number
  source: "DIRECT_SALE" | "SALES_ORDER"
  salesOrderId: string | null
  salesOrderNumber: number | null
  clientId: string | null
  clientName: string | null
  clientDocument: string | null
  operator: string
  status: "COMPLETED" | "CANCELLED"
  subtotal: number
  itemDiscount: number
  generalDiscount: number
  freight: number
  total: number
  totalReceived: number
  totalChange: number
  items: SalesDocumentItem[]
  payments: SaleReceiptPayment[]
  createdAt: string
  cancelledAt: string | null
  cancelledBy: string | null
  cancelReason: string | null
}
