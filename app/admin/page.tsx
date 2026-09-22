"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ErpLayout } from "@/components/erp-layout"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { UserPlus, RefreshCw } from "lucide-react"
import { apiFetch, type SessionUser } from "@/lib/auth-client"

const ROLES = ["ADMIN", "OPERADOR"]

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [users, setUsers] = React.useState<SessionUser[]>([])
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [displayName, setDisplayName] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [role, setRole] = React.useState("OPERADOR")
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)

  async function loadUsers() {
    setLoadingUsers(true)
    setFeedback(null)
    try {
      setUsers(((await apiFetch("/api/users")) as SessionUser[]) ?? [])
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao listar usuarios." })
    } finally {
      setLoadingUsers(false)
    }
  }

  React.useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login")
      else if (user.role !== "ADMIN") router.replace("/")
      else loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setFeedback(null)
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ displayName, username, password, role }),
      })
      setDisplayName("")
      setUsername("")
      setPassword("")
      setFeedback({ type: "ok", text: "Usuario criado com sucesso." })
      await loadUsers()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao criar usuario." })
    }
  }

  async function toggleActive(target: SessionUser) {
    setFeedback(null)
    try {
      await apiFetch(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !target.active }),
      })
      setFeedback({ type: "ok", text: `Usuario ${target.active ? "desativado" : "ativado"}.` })
      await loadUsers()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao atualizar usuario." })
    }
  }

  async function changeRole(target: SessionUser, nextRole: string) {
    setFeedback(null)
    try {
      await apiFetch(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      })
      setFeedback({ type: "ok", text: "Papel atualizado." })
      await loadUsers()
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao atualizar papel." })
    }
  }

  async function resetPassword(target: SessionUser) {
    const next = window.prompt(`Nova senha para ${target.displayName} (minimo 6 caracteres):`)
    if (!next) return
    setFeedback(null)
    try {
      await apiFetch(`/api/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: next }),
      })
      setFeedback({ type: "ok", text: "Senha redefinida." })
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao redefinir senha." })
    }
  }

  if (loading || (user && user.role === "ADMIN" && loadingUsers && users.length === 0 && !feedback)) {
    return (
      <ErpLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      </ErpLayout>
    )
  }

  return (
    <ErpLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Usuarios e Permissoes</h1>
          <p className="text-sm text-muted-foreground">
            Crie usuarios e controle o papel de acesso de cada pessoa ao SmartStock.
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "ok"
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "border-red-500/30 bg-red-500/10 text-red-500"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Novo usuario</h2>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Maria Silva"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Identificador / e-mail</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="maria.silva"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha inicial</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Papel</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "ADMIN" ? "Admin (acesso total)" : "Operador (telas do ERP)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Criar usuario
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Usuarios cadastrados</h2>
              <Badge variant="secondary">{users.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={loadUsers}>
              <RefreshCw className="size-3.5 mr-1.5" />
              Atualizar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Identificador</th>
                  <th className="pb-2 pr-4 font-medium">Papel</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 text-foreground">{u.displayName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{u.username}</td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={u.role}
                        disabled={u.username === "admin"}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge
                        variant={u.active ? "default" : "secondary"}
                        className={u.active ? "bg-[#22c55e] text-white border-0" : ""}
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(u)}
                          disabled={u.username === "admin"}
                        >
                          {u.active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPassword(u)}
                          disabled={u.username === "admin"}
                        >
                          Redefinir senha
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loadingUsers && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Nenhum usuario cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpLayout>
  )
}
