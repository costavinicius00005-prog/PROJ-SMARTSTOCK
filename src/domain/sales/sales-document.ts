export type QuoteStatus = "DRAFT" | "OPEN" | "CONVERTED" | "CANCELLED" | "EXPIRED"
export type OrderStatus = "OPEN" | "CONFIRMED" | "FULFILLED" | "CANCELLED"

export interface SalesDocumentItem {
  id: string
  productId: string
  productCode: string
  productName: string
  unitOfMeasure: string
  quantity: number
  unitPrice: number
  discount: number
  grossSubtotal: number
  netSubtotal: number
}

export interface SalesQuote {
  id: string
  number: number
  clientId: string | null
  clientName: string | null
  clientDocument: string | null
  issueDate: string
  validUntil: string | null
  status: QuoteStatus
  notes: string | null
  generalDiscount: number
  freight: number
  subtotal: number
  itemDiscount: number
  total: number
  salesOrderId: string | null
  salesOrderNumber: number | null
  items: SalesDocumentItem[]
  createdAt: string
  updatedAt: string
}

export interface SalesOrder {
  id: string
  number: number
  sourceQuoteId: string
  sourceQuoteNumber: number
  clientId: string
  clientName: string
  clientDocument: string | null
  issueDate: string
  status: OrderStatus
  notes: string | null
  generalDiscount: number
  freight: number
  subtotal: number
  itemDiscount: number
  total: number
  items: SalesDocumentItem[]
  createdAt: string
  updatedAt: string
}

export interface SaveQuotePayload {
  clientId: string | null
  issueDate: string
  validUntil: string | null
  status: "DRAFT" | "OPEN"
  notes: string
  generalDiscount: number
  freight: number
  items: Array<{ productId: string; quantity: number; unitPrice: number; discount: number }>
}
