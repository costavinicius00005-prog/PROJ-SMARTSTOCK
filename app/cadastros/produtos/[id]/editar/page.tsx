import { ProductEditContent } from "@/components/product-edit-content"
import { ErpLayout } from "@/components/erp-layout"

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params

  return (
    <ErpLayout>
      <ProductEditContent productId={id} />
    </ErpLayout>
  )
}
