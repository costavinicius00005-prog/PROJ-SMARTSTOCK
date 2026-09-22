"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ErpLayout } from "@/components/erp-layout"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Database, Server, Smartphone, Globe, RefreshCw, CheckCircle2, XCircle } from "lucide-react"

type SystemStatus = {
  service: string
  status: string
  database: {
    connected: boolean
    product?: string
    version?: string
    name?: string
    host?: string
    migrations?: number
    tables?: { name: string; rows: number }[]
    error?: string
  }
  modules: { name: string; type: string; baseUrl: string }[]
}

export default function IntegracaoPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = React.useState<SystemStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  async function loadStatus() {
    setLoadingStatus(true)
    setError(null)
    try {
      const response = await fetch("/api/system/status")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      setStatus(await response.json())
    } catch {
      setError("Nao foi possivel consultar o status do sistema.")
    } finally {
      setLoadingStatus(false)
    }
  }

  React.useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login")
      else loadStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  if (loading || (user && loadingStatus && !status)) {
    return (
      <ErpLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="size-8" />
        </div>
      </ErpLayout>
    )
  }

  const db = status?.database
  const connected = db?.connected === true

  return (
    <ErpLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Integracao e Banco de Dados</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Todos os modulos do SmartStock — o ERP web, a API REST e o aplicativo mobile de
              entregas — leem e gravam no mesmo banco PostgreSQL. Esta tela comprova a conexao
              em tempo real.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus}>
            <RefreshCw className="size-3.5 mr-1.5" />
            Atualizar
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Banco de dados (PostgreSQL)</h2>
              </div>
              {connected ? (
                <Badge className="bg-[#22c55e] text-white border-0">
                  <CheckCircle2 className="size-3 mr-1" /> Conectado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="size-3 mr-1" /> Offline
                </Badge>
              )}
            </div>

            {connected && db ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Banco</dt>
                  <dd className="font-medium text-foreground">{db.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Versao</dt>
                  <dd className="font-medium text-foreground">{db.version}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Servidor</dt>
                  <dd className="font-medium text-foreground">{db.host ?? "db (container)"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Migracoes aplicadas</dt>
                  <dd className="font-medium text-foreground">{db.migrations}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{db?.error ?? "Sem conexao com o banco."}</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Modulos conectados ao mesmo banco</h2>
            </div>
            <ul className="space-y-3">
              {(status?.modules ?? []).map((module) => (
                <li key={module.name} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                  {module.name === "mobile-delivery" ? (
                    <Smartphone className="size-4 text-muted-foreground" />
                  ) : module.name === "web-erp" ? (
                    <Globe className="size-4 text-muted-foreground" />
                  ) : (
                    <Server className="size-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {module.type} · {module.baseUrl}
                    </p>
                  </div>
                  <Badge variant="secondary">{module.type}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Dados compartilhados (registros por tabela)</h2>
          {db?.tables && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {db.tables.map((table) => (
                <div key={table.name} className="rounded-lg border border-border/60 p-3">
                  <p className="text-2xl font-bold text-foreground">{table.rows}</p>
                  <p className="text-xs text-muted-foreground font-mono">{table.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErpLayout>
  )
}
