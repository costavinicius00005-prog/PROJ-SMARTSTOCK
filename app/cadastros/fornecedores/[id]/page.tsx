import { SupplierDetailsContent } from "@/components/supplier-details-content"
import { ErpLayout } from "@/components/erp-layout"

export default async function SupplierDetailsPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  return (
    <ErpLayout>
      <SupplierDetailsContent supplierId={id} />
    </ErpLayout>
  )
}
