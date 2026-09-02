import type { SalesDocumentItem } from "@/src/domain/sales/sales-document"
export interface PaymentMethod { id: string; code: string; name: string; kind: string; allowsChange: boolean; allowsCredit: boolean }
export interface CompletedSale { id: string; number: number; source: "DIRECT_SALE" | "SALES_ORDER"; total: number; items: SalesDocumentItem[] }
export interface CompleteSalePayload { salesOrderId: string | null; clientId: string | null; generalDiscount: number; notes: string; items: Array<{ productId: string; quantity: number; discount: number }>; payments: Array<{ paymentMethodId: string; amount: number; receivedAmount: number; installments: number }> }
