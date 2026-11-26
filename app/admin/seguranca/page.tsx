"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { ErpLayout } from "@/components/erp-layout"
import { useAuth } from "@/components/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/lib/auth-client"

type AuditEntry = {
  id: number
  occurredAt: string
  eventType: string
  username: string | null
  role: string | null
  ipAddress: string | null
  method: string | null
  path: string | null
  status: number | null
  targetType: string | null
  targetId: string | null
  detail: string | null
}

type SessionInfo = {
  id: string
  userId: number
  username: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
}

const EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Login",
  LOGIN_FAILURE: "Login recusado",
  LOGIN_BLOCKED: "Login bloqueado",
  LOGOUT: "Logout",
  SESSION_REVOKED: "Sessao encerrada",
  PASSWORD_CHANGED: "Senha alterada",
  ACCESS_DENIED: "Acesso negado",
  PERSONAL_DATA_READ: "Leitura de dados pessoais",
  PERSONAL_DATA_LIST: "Listagem de clientes",
  PERSONAL_DATA_CHANGE: "Alteracao de cadastro",
  PERSONAL_DATA_EXPORT: "Exportacao (titular)",
  PERSONAL_DATA_ANONYMIZE: "Anonimizacao",
  PERSONAL_DATA_ANONYMIZE_DETAIL: "Anonimizacao (detalhe)",
  DATA_EXPORT: "Relatorio/exportacao",
  LOCATION_READ: "Consulta de GPS",
  USER_ADMIN_CHANGE: "Alteracao de usuario",
  SETTINGS_CHANGE: "Alteracao de configuracao",
}

const ALERT_EVENTS = new Set(["LOGIN_FAILURE", "LOGIN_BLOCKED", "ACCESS_DENIED"])

const when = (value: string) => new Date(value).toLocaleString("pt-BR")

export default function SecurityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [sessions, setSessions] = React.useState<SessionInfo[]>([])
  const [eventType, setEventType] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: "300" })
      if (eventType) params.set("eventType", eventType)
      if (username.trim()) params.set("username", username.trim())
      const [audit, active] = await Promise.all([
        apiFetch(`/api/security/audit?${params}`),
        apiFetch("/api/security/sessions"),
      ])
      setEntries((audit as AuditEntry[]) ?? [])
      setSessions((active as SessionInfo[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a trilha de seguranca.")
    } finally {
      setBusy(false)
    }
  }, [eventType, username])

  React.useEffect(() => {
    if (loading) return
    if (!user) router.replace("/login")
    else if (user.role !== "ADMIN") router.replace("/")
    else load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, eventType])

  async function revoke(id: string) {
    await apiFetch(`/api/security/sessions/${id}`, { method: "DELETE" }).catch(() => undefined)
    load()
  }

  const alerts = entries.filter((e) => ALERT_EVENTS.has(e.eventType)).length

  return (
    <ErpLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Administracao &gt; Seguranca e LGPD</p>
            <h1 className="text-2xl font-semibold">Seguranca e LGPD</h1>
            <p className="text-sm text-muted-foreground">
              Trilha de auditoria (somente leitura, nao pode ser alterada) e sessoes abertas no sistema.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={busy}>
            <RefreshCw className="size-4" /> Atualizar
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sessoes ativas</p><p className="text-2xl font-bold">{sessions.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Eventos listados</p><p className="text-2xl font-bold">{entries.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Falhas e negativas na lista</p><p className={`text-2xl font-bold ${alerts ? "text-destructive" : ""}`}>{alerts}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Sessoes ativas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>IP</TableHead><TableHead>Inicio</TableHead><TableHead>Ultimo acesso</TableHead><TableHead>Expira</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.username}</TableCell>
                    <TableCell>{s.ipAddress ?? "-"}</TableCell>
                    <TableCell>{when(s.createdAt)}</TableCell>
                    <TableCell>{when(s.lastSeenAt)}</TableCell>
                    <TableCell>{when(s.expiresAt)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => revoke(s.id)}>Encerrar</Button></TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma sessao ativa.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-base">Trilha de auditoria</CardTitle>
            <div className="flex flex-wrap gap-2">
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="">Todos os eventos</option>
                {Object.entries(EVENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <Input className="h-9 w-56" placeholder="Filtrar por usuario" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
              <Button size="sm" variant="outline" onClick={load}>Filtrar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Evento</TableHead><TableHead>Usuario</TableHead><TableHead>IP</TableHead><TableHead>Operacao</TableHead><TableHead>Detalhe</TableHead></TableRow></TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs">{when(e.occurredAt)}</TableCell>
                    <TableCell>
                      <Badge variant={ALERT_EVENTS.has(e.eventType) ? "destructive" : "secondary"}>{EVENT_LABELS[e.eventType] ?? e.eventType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.username ?? "-"}{e.role ? <span className="block text-xs text-muted-foreground">{e.role}</span> : null}</TableCell>
                    <TableCell className="text-xs">{e.ipAddress ?? "-"}</TableCell>
                    <TableCell className="max-w-64 truncate text-xs" title={`${e.method ?? ""} ${e.path ?? ""}`}>{e.method} {e.path} {e.status ? `(${e.status})` : ""}</TableCell>
                    <TableCell className="max-w-80 text-xs text-muted-foreground">{e.detail ?? (e.targetId ? `${e.targetType} ${e.targetId}` : "-")}</TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum evento.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ErpLayout>
  )
}
