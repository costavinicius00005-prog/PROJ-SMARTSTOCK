import { Suspense } from "react"
import { ErpLayout } from "@/components/erp-layout"
import { ReceivableReportsContent } from "@/components/receivables/receivable-reports-content"

export default function CreditReportsPage() {
  return (
    <ErpLayout>
      <Suspense>
        <ReceivableReportsContent />
      </Suspense>
    </ErpLayout>
  )
}
