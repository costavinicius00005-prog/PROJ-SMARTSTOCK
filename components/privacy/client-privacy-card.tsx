"use client"

import * as React from "react"
import { Download, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth/auth-context"
import { apiFetch } from "@/lib/auth-client"

type AnonymizationResult = { level: "PARTIAL" | "FULL"; explanation: string }

/** Direitos do titular (LGPD art. 18): exportar dados e anonimizar. Visivel apenas para ADMIN. */
export function ClientPrivacyCard({ clientId, onChanged }: { clientId: string; onChanged: () => void }) {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)

  if (user?.role !== "ADMIN") return null

  async function exportData() {
    setMessage(null)
    const response = await fetch(`/api/clients/${clientId}/data-export`, { cache: "no-store" })
    if (!response.ok) {
      setMessage({ ok: false, text: "Nao foi possivel exportar os dados do titular." })
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `dados-titular-${clientId}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ ok: true, text: "Arquivo gerado. Entregue ao titular por canal seguro." })
  }

  async function anonymize() {
    setBusy(true)
    setMessage(null)
    try {
      const result = (await apiFetch(`/api/clients/${clientId}/anonymize`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })) as AnonymizationResult
      setOpen(false)
      setReason("")
      setMessage({ ok: true, text: result.explanation })
      onChanged()
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Falha ao anonimizar." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4" /> Privacidade (LGPD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Atendimento aos direitos do titular. Toda acao fica registrada na trilha de seguranca.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="size-4" /> Exportar dados do titular
          </Button>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Anonimizar cliente
          </Button>
        </div>
        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-destructive"}`}>{message.text}</p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonimizar cliente</DialogTitle>
            <DialogDescription>
              Sem historico comercial dentro do prazo legal, todos os dados que identificam o titular sao
              eliminados. Com historico recente, so os dados nao obrigatorios saem e o cadastro fica bloqueado para
              novas vendas. A operacao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lgpd-reason">Justificativa</Label>
            <Textarea
              id="lgpd-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: pedido de eliminacao feito pelo titular por e-mail em 25/11/2026"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={busy || reason.trim().length < 10} onClick={anonymize}>
              {busy ? "Anonimizando..." : "Confirmar anonimizacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
