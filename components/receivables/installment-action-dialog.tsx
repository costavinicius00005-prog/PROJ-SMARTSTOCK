"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { brDate, brl, receivablesFetch, type InstallmentRow, type ReceivablePaymentRow } from "@/src/domain/receivables/receivables"

export type InstallmentAction =
  | { kind: "due-date"; installment: InstallmentRow }
  | { kind: "amount"; installment: InstallmentRow }
  | { kind: "notes"; installment: InstallmentRow }
  | { kind: "cancel"; installment: InstallmentRow }
  | { kind: "reopen"; installment: InstallmentRow }
  | { kind: "reverse"; installment: InstallmentRow; payment: ReceivablePaymentRow }

const TITLES: Record<InstallmentAction["kind"], string> = {
  "due-date": "Alterar vencimento",
  amount: "Alterar valor",
  notes: "Observacoes da parcela",
  cancel: "Cancelar parcela",
  reopen: "Reabrir parcela",
  reverse: "Estornar recebimento",
}

/** Dialogo unico para as operacoes administrativas (todas auditadas e com justificativa, exceto observacao). */
export function InstallmentActionDialog({ action, onClose, onDone }: { action: InstallmentAction | null; onClose: () => void; onDone: () => void }) {
  const [dueDate, setDueDate] = useState("")
  const [amount, setAmount] = useState(0)
  const [notes, setNotes] = useState("")
  const [justification, setJustification] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!action) return
    setDueDate(action.installment.dueDate)
    setAmount(Number(action.installment.amount))
    setNotes(action.installment.notes ?? "")
    setJustification("")
    setError(null)
  }, [action])

  const needsJustification = action !== null && action.kind !== "notes"
  const invalid = needsJustification && justification.trim().length < 5 ? "Informe a justificativa (minimo 5 caracteres)." : null

  async function submit() {
    if (!action || invalid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(null)
    const id = action.installment.installmentId
    try {
      switch (action.kind) {
        case "due-date":
          await receivablesFetch(`installments/${id}/due-date`, { method: "PATCH", body: JSON.stringify({ dueDate, justification }) })
          break
        case "amount":
          await receivablesFetch(`installments/${id}/amount`, { method: "PATCH", body: JSON.stringify({ amount: Math.round(amount * 100) / 100, justification }) })
          break
        case "notes":
          await receivablesFetch(`installments/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) })
          break
        case "cancel":
          await receivablesFetch(`installments/${id}/cancel`, { method: "POST", body: JSON.stringify({ justification }) })
          break
        case "reopen":
          await receivablesFetch(`installments/${id}/reopen`, { method: "POST", body: JSON.stringify({ justification }) })
          break
        case "reverse":
          await receivablesFetch(`payments/${action.payment.paymentId}/reverse`, { method: "POST", body: JSON.stringify({ justification }) })
          break
      }
      toast({ title: `${TITLES[action.kind]}: concluido`, description: `Parcela ${action.installment.titleCode} · operacao registrada no historico.` })
      onDone()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operacao nao realizada.")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const i = action?.installment
  return (
    <Dialog open={action !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action ? TITLES[action.kind] : ""} · {i?.titleCode}</DialogTitle>
          <DialogDescription>
            {i?.clientName} · vencimento {brDate(i?.dueDate)} · valor {brl(i?.amount)} · saldo {brl(i?.balance)}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
          {action?.kind === "due-date" && (
            <div className="grid gap-1.5"><Label htmlFor="action-due">Novo vencimento</Label><Input id="action-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          )}
          {action?.kind === "amount" && (
            <div className="grid gap-1.5">
              <Label htmlFor="action-amount">Novo valor</Label>
              <Input id="action-amount" type="number" min="0.01" step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Permitido apenas em parcela sem recebimentos. O valor original ({brl(i?.originalAmount)}) fica preservado.</p>
            </div>
          )}
          {action?.kind === "notes" && (
            <div className="grid gap-1.5"><Label htmlFor="action-notes">Observacoes</Label><Textarea id="action-notes" maxLength={500} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          )}
          {action?.kind === "cancel" && <p className="text-sm text-muted-foreground">A parcela deixa de compor o saldo do cliente. O registro e mantido no historico e pode ser reaberto por usuario autorizado.</p>}
          {action?.kind === "reopen" && <p className="text-sm text-muted-foreground">A parcela volta a ficar em aberto com o valor de {brl(i?.amount)}.</p>}
          {action?.kind === "reverse" && <p className="text-sm text-muted-foreground">O recebimento de {brl(action.payment.amount)} ({action.payment.methodName}, {brDate(action.payment.paidAt)}) sera estornado e o valor volta ao saldo da parcela. O registro original e mantido.</p>}
          {needsJustification && (
            <div className="grid gap-1.5"><Label htmlFor="action-justification">Justificativa</Label><Textarea id="action-justification" maxLength={500} rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Obrigatoria - fica registrada na auditoria" /></div>
          )}
          {(error || (justification && invalid)) && <p className="text-sm text-destructive">{error ?? invalid}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Voltar</Button>
            <Button type="submit" variant={action?.kind === "cancel" || action?.kind === "reverse" ? "destructive" : "default"} disabled={saving || Boolean(invalid)}>
              {saving && <Loader2 className="size-4 animate-spin" />}Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
