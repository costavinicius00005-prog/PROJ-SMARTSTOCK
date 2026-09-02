"use client"

import { ErpLayout } from "@/components/erp-layout"
import { ClientRegistrationContent } from "@/components/client-registration-content"

export default function NewSupplierPage() {
  return (
    <ErpLayout>
      <ClientRegistrationContent partnerKind="supplier" />
    </ErpLayout>
  )
}
