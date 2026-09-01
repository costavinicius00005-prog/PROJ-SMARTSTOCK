"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductRegistrationContent } from "@/components/product-registration-content"
import type { ProductRegistration } from "@/src/domain/catalog/product-registration"
import type { RegisteredProduct } from "@/src/domain/catalog/registered-product"

type LoadStatus = "loading" | "loaded" | "error"

export function ProductEditContent({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductRegistration | null>(null)
  const [status, setStatus] = useState<LoadStatus>("loading")

  useEffect(() => {
    const loadProduct = async () => {
      setStatus("loading")

      try {
        const response = await fetch(`/api/products/${productId}`, { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar o produto.")
        }

        const data = (await response.json()) as RegisteredProduct
        setProduct({
          name: data.name ?? "",
          categoryId: data.categoryId ?? "",
          brandId: data.brandId ?? "",
          internalCode: data.internalCode ?? "",
          variationType: data.variationType || "Produto simples",
          description: data.description ?? "",
          unitOfMeasureId: data.unitOfMeasureId ?? "",
          costValue: data.costValue ?? 0,
          saleMarkup: data.saleMarkup ?? 0,
          salePrice: data.salePrice ?? 0,
          barcode: data.barcode ?? "",
          composition: (data.composition ?? []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        })
        setStatus("loaded")
      } catch {
        setStatus("error")
      }
    }

    loadProduct()
  }, [productId])

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#eef1f6] p-6 text-sm text-muted-foreground">
        Carregando produto...
      </div>
    )
  }

  if (status === "error" || !product) {
    return (
      <div className="grid min-h-full place-items-center bg-[#eef1f6] p-6">
        <div className="grid gap-3 rounded-md border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-destructive">Nao foi possivel carregar o produto.</p>
          <Button asChild variant="outline" className="rounded-sm">
            <Link href="/cadastros/produtos">Voltar para a lista</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProductRegistrationContent
      key={productId}
      initialValue={product}
      productId={productId}
      title="Editar produto"
    />
  )
}
