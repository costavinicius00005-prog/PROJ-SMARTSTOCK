import { ErpLayout } from "@/components/erp-layout"
import { SalesOrderContent } from "@/components/sales-order-content"
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ErpLayout><SalesOrderContent quoteId={id} /></ErpLayout> }
