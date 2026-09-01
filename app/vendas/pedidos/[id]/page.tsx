import { ErpLayout } from "@/components/erp-layout"
import { SalesOrderDetailsContent } from "@/components/sales-order-details-content"
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ErpLayout><SalesOrderDetailsContent orderId={id} /></ErpLayout> }
