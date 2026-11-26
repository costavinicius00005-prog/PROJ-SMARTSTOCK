"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiFetch, changePassword } from "@/lib/auth-client"

type SessionRow = {
  id: string
  current: boolean
  createdAt: string
  lastSeenAt: string
  ipAddress: string | null
  userAgent: string | null
}

const when = (value: string) => new Date(value).toLocaleString("pt-BR")

function browserLabel(userAgent: string | null) {
  if (!userAgent) return "Dispositivo desconhecido"
  if (/dart|okhttp|android/i.test(userAgent) && !/chrome|firefox|safari/i.test(userAgent)) return "Aplicativo"
  if (/edg\//i.test(userAgent)) return "Edge"
  if (/chrome/i.test(userAgent)) return "Chrome"
  if (/firefox/i.test(userAgent)) return "Firefox"
  if (/safari/i.test(userAgent)) return "Safari"
  return userAgent.slice(0, 40)
}

/** "Minha conta": troca de senha e sessoes abertas do proprio usuario. */
export function AccountSecurityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [sessions, setSessions] = React.useState<SessionRow[]>([])

  const loadSessions = React.useCallback(async () => {
    try {
      setSessions(((await apiFetch("/api/auth/sessions")) as SessionRow[]) ?? [])
    } catch {
      setSessions([])
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      setMessage(null)
      loadSessions()
    }
  }, [open, loadSessions])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    if (next !== confirm) {
      setMessage({ ok: false, text: "A confirmacao nao confere com a nova senha." })
      return
    }
    setBusy(true)
    try {
      const result = await changePassword(current, next)
      setCurrent("")
      setNext("")
      setConfirm("")
      setMessage({
        ok: true,
        text: `Senha alterada.${result.otherSessionsRevoked ? ` ${result.otherSessionsRevoked} outra(s) sessao(oes) foram encerradas.` : ""}`,
      })
      loadSessions()
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Nao foi possivel alterar a senha." })
    } finally {
      setBusy(false)
    }
  }

  async function endOthers() {
    await apiFetch("/api/auth/logout-others", { method: "POST" }).catch(() => undefined)
    loadSessions()
  }

  async function endOne(id: string) {
    await apiFetch(`/api/auth/sessions/${id}`, { method: "DELETE" }).catch(() => undefined)
    loadSessions()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Minha conta</DialogTitle>
          <DialogDescription>
            Senha com no minimo 8 caracteres, letras e numeros. Ao trocar a senha, as outras sessoes sao encerradas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Senha atual</Label>
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">Nova senha</Label>
              <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-confirm">Confirmar</Label>
              <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
          </div>
          {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-destructive"}`}>{message.text}</p>}
          <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Alterar senha"}</Button>
        </form>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Sessoes abertas</p>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={endOthers}>Encerrar as outras</Button>
            )}
          </div>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">
                    {browserLabel(s.userAgent)} {s.current && <span className="text-xs text-emerald-700">(esta sessao)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP {s.ipAddress ?? "-"} · ultimo acesso {when(s.lastSeenAt)}
                  </p>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="sm" onClick={() => endOne(s.id)}>Encerrar</Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
