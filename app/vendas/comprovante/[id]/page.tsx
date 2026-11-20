"use client"

import { Suspense, use, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SaleReceiptView, type StoreSettings } from "@/components/sale-receipt"
import type { SaleReceipt } from "@/src/domain/sales/checkout"

/**
 * Pagina de impressao do comprovante (sem o layout do ERP).
 * ?formato=a4 imprime em papel comum; padrao = bobina termica 80mm. ?imprimir=1 abre a impressao.
 */
export default function SaleReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Suspense>
      <ReceiptPrint id={id} />
    </Suspense>
  )
}

function ReceiptPrint({ id }: { id: string }) {
  const searchParams = useSearchParams()
  const format = searchParams.get("formato") === "a4" ? "a4" : "80mm"
  const autoPrint = searchParams.get("imprimir") === "1"
  const [sale, setSale] = useState<SaleReceipt | null>(null)
  const [store, setStore] = useState<StoreSettings>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/sales/checkout/sales/${id}`, { cache: "no-store" }).then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.message ?? "Venda nao encontrada.")
        return data as SaleReceipt
      }),
      fetch("/api/settings", { cache: "no-store" }).then((response) => (response.ok ? response.json() : {})).catch(() => ({})),
    ])
      .then(([saleData, settings]) => {
        setSale(saleData)
        setStore(settings as StoreSettings)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o comprovante."))
  }, [id])

  useEffect(() => {
    if (sale && autoPrint) {
      const timer = window.setTimeout(() => window.print(), 300)
      return () => window.clearTimeout(timer)
    }
  }, [sale, autoPrint])

  return (
    <div className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <style>{format === "a4"
        ? "@page { size: A4; margin: 15mm; }"
        : "@page { size: 80mm auto; margin: 0; } @media print { .receipt { max-width: 80mm !important; } }"}</style>

      <div className="mx-auto mb-4 flex max-w-md flex-wrap items-center justify-center gap-2 print:hidden">
        <Button onClick={() => window.print()} disabled={!sale}>
          <Printer className="size-4" />
          Imprimir
        </Button>
        <Button variant="outline" asChild>
          <a href={`?formato=${format === "a4" ? "80mm" : "a4"}`}>
            {format === "a4" ? "Usar bobina 80mm" : "Usar papel A4"}
          </a>
        </Button>
        <span className="w-full text-center text-xs text-muted-foreground">
          Formato atual: {format === "a4" ? "papel comum (A4)" : "impressora termica (80mm)"}
        </span>
      </div>

      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
      {!sale && !error ? (
        <div className="flex justify-center">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : null}
      {sale ? (
        <div className="mx-auto w-fit shadow-md print:shadow-none">
          <SaleReceiptView sale={sale} store={store} />
        </div>
      ) : null}
    </div>
  )
}
