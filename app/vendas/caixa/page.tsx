import { Suspense } from "react"
import { ErpLayout } from "@/components/erp-layout"
import { WebCheckoutContent } from "@/components/web-checkout-content"
export default function WebCheckoutPage() { return <ErpLayout><Suspense><WebCheckoutContent /></Suspense></ErpLayout> }
