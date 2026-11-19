import { ClientDetailsContent } from "@/components/client-details-content"
import { ErpLayout } from "@/components/erp-layout"

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  return (
    <ErpLayout>
      <ClientDetailsContent clientId={id} />
    </ErpLayout>
  )
}
