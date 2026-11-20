"use client"

import { FormEvent, useEffect, useState } from "react"
import { Equal, Loader2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RegisteredProduct } from "@/src/domain/catalog/registered-product"

type StockMode = "definir" | "acrescentar" | "diminuir"

const modes: { value: StockMode; label: string; icon: typeof Equal }[] = [
  { value: "definir", label: "Definir saldo", icon: Equal },
  { value: "acrescentar", label: "Acrescentar", icon: Plus },
  { value: "diminuir", label: "Diminuir", icon: Minus },
]

const formatQuantity = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })

export function ProductStockDialog({
  product,
  onClose,
  onSaved,
}: {
  product: RegisteredProduct | null
  onClose: () => void
  onSaved: (product: RegisteredProduct) => void
}) {
  const [mode, setMode] = useState<StockMode>("definir")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setMode("definir")
      setQuantity("")
      setNote("")
      setError(null)
    }
  }, [product])

  const current = Number(product?.stockQuantity ?? 0)
  const amount = quantity === "" ? null : Number(quantity)
  const validAmount = amount !== null && Number.isFinite(amount) && amount >= 0
  const nextBalance = !validAmount
    ? null
    : mode === "definir"
      ? amount
      : mode === "acrescentar"
        ? current + amount
        : current - amount

  const validationMessage = (() => {
    if (amount === null) return null
    if (!validAmount) return "Informe uma quantidade valida (maior ou igual a zero)."
    if (mode !== "definir" && amount === 0) return "A quantidade deve ser maior que zero."
    if (mode === "definir" && amount === current) return "O produto ja possui esse saldo."
    if (nextBalance !== null && nextBalance < 0) return `Estoque insuficiente. Saldo atual: ${formatQuantity(current)}`
    return null
  })()
  const canSubmit = validAmount && !validationMessage && !saving

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product || !canSubmit || amount === null) return

    setSaving(true)
    setError(null)
    const defaultNote = {
      definir: "Saldo definido pela listagem de produtos",
      acrescentar: "Entrada pela listagem de produtos",
      diminuir: "Saida pela listagem de produtos",
    }[mode]
    const body =
      mode === "definir"
        ? { productId: product.id, type: "AJUSTE", targetQuantity: amount }
        : { productId: product.id, type: mode === "acrescentar" ? "ENTRADA" : "SAIDA", quantity: amount }

    try {
      const response = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, note: note.trim() || defaultNote, origin: "Listagem de produtos" }),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) throw new Error(json?.message ?? "Nao foi possivel atualizar o estoque.")

      const refreshed = await fetch(`/api/products/${product.id}`, { cache: "no-store" })
      if (refreshed.ok) {
        onSaved((await refreshed.json()) as RegisteredProduct)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel atualizar o estoque.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Editar estoque</DialogTitle>
            <DialogDescription>
              {product?.name}
              {product?.internalCode ? ` · ${product.internalCode}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">Saldo atual</span>
            <span className="font-semibold text-foreground">
              {formatQuantity(current)} {product?.unitOfMeasure}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de alteracao">
            {modes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                  mode === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            {mode === "definir" ? "Novo saldo" : "Quantidade"}
            <Input
              autoFocus
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="h-11 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-foreground">
            Observacao <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            <Input value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} className="h-10" />
          </label>

          {validationMessage || error ? (
            <p className="text-sm text-destructive">{validationMessage ?? error}</p>
          ) : nextBalance !== null ? (
            <p className="text-sm text-muted-foreground">
              Saldo apos a alteracao:{" "}
              <span className="font-semibold text-foreground">{formatQuantity(nextBalance)}</span>
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar estoque"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
