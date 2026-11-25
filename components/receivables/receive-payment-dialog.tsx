"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import type { PaymentMethod } from "@/src/domain/sales/checkout"
import { brDate, brl, receivablesFetch, type InstallmentRow } from "@/src/domain/receivables/receivables"

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

/**
 * Baixa de parcela (integral ou parcial). O valor ja vem preenchido com o saldo; cada abertura do
 * dialogo gera um identificador unico, entao cliques repetidos nao duplicam o recebimento.
 */
export function ReceivePaymentDialog({
  installment,
  methods,
  onClose,
  onReceived,
}: {
  installment: InstallmentRow | null
  methods: PaymentMethod[]
  onClose: () => void
  onReceived: () => void
}) {
  const receiptMethods = methods.filter((m) => !m.allowsCredit)
  const [amount, setAmount] = useState(0)
  const [methodId, setMethodId] = useState("")
  const [paidAt, setPaidAt] = useState(todayIso())
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef<string>(newId())
  const savingRef = useRef(false)

  useEffect(() => {
    if (!installment) return
    setAmount(Number(installment.balance))
    setMethodId((current) => current || receiptMethods.find((m) => m.code === "CASH")?.id || receiptMethods[0]?.id || "")
    setPaidAt(todayIso())
    setNotes("")
    setError(null)
    requestId.current = newId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installment])

  const balance = Number(installment?.balance ?? 0)
  const remaining = Math.max(0, Math.round((balance - amount) * 100) / 100)
  const invalid = !methodId ? "Selecione a forma de recebimento." : amount <= 0 ? "Informe um valor maior que zero." : amount > balance + 0.0001 ? `O valor nao pode passar do saldo (${brl(balance)}).` : !paidAt || paidAt > todayIso() ? "A data do recebimento nao pode ser futura." : null

  async function submit() {
    if (!installment || invalid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    try {
      await receivablesFetch(`installments/${installment.installmentId}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Math.round(amount * 100) / 100, paymentMethodId: methodId, paidAt, notes, requestId: requestId.current }),
      })
      toast({
        title: remaining === 0 ? `Parcela ${installment.titleCode} quitada` : `Recebimento registrado na parcela ${installment.titleCode}`,
        description: `${brl(amount)} recebido de ${installment.clientName}.${remaining > 0 ? ` Saldo restante: ${brl(remaining)}.` : ""}`,
      })
      onReceived()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nao foi possivel registrar o recebimento.")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Dialog open={installment !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receber parcela {installment?.titleCode}</DialogTitle>
          <DialogDescription>
            {installment?.clientName} · venda nº {installment?.saleNumber} · vencimento {brDate(installment?.dueDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-medium">{brl(installment?.amount)}</p></div>
          <div><p className="text-xs text-muted-foreground">Ja pago</p><p className="font-medium">{brl(installment?.paidAmount)}</p></div>
          <div><p className="text-xs text-muted-foreground">Saldo</p><p className="font-semibold text-primary">{brl(balance)}</p></div>
        </div>

        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="receive-amount">Valor recebido</Label>
              <Input id="receive-amount" autoFocus type="number" min="0.01" step="0.01" max={balance} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="receive-date">Data do recebimento</Label>
              <Input id="receive-date" type="date" max={todayIso()} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Forma de recebimento</Label>
            <Select value={methodId} onValueChange={setMethodId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{receiptMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="receive-notes">Observacoes</Label>
            <Textarea id="receive-notes" maxLength={500} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <p className="text-sm text-muted-foreground">
            {amount > 0 && amount < balance ? <>Baixa <strong>parcial</strong>: restarao {brl(remaining)} em aberto.</> : amount === balance && balance > 0 ? <>Baixa <strong>integral</strong>: a parcela ficara quitada.</> : null}
          </p>
          {(invalid || error) && <p className="text-sm text-destructive">{error ?? invalid}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving || Boolean(invalid)}>{saving && <Loader2 className="size-4 animate-spin" />}Confirmar baixa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
