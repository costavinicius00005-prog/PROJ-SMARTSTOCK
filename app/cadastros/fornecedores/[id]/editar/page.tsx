import { ClientEditContent } from "@/components/client-edit-content"
import { ErpLayout } from "@/components/erp-layout"

export default async function SupplierEditPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  return (
    <ErpLayout>
      <ClientEditContent clientId={id} partnerKind="supplier" />
    </ErpLayout>
  )
}
