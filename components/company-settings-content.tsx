"use client"

import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Save, RefreshCw } from "lucide-react"

type SettingsMap = Record<string, string>

export function CompanySettingsContent() {
  const [settings, setSettings] = React.useState<SettingsMap | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: "ok" | "error"; text: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch("/api/settings", { cache: "no-store" })
      setSettings(await response.json())
    } catch {
      setFeedback({ type: "error", text: "Falha ao carregar configuracoes." })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...(prev ?? {}), [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!settings) return
    setSaving(true)
    setFeedback(null)
    try {
      const companyKeys = Object.keys(settings).filter((k) => k.startsWith("company."))
      const payload: SettingsMap = {}
      for (const key of companyKeys) payload[key] = settings[key]
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Falha ao salvar.")
      setFeedback({ type: "ok", text: "Dados da empresa salvos. O nome aparece no cabecalho do sistema." })
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Falha ao salvar." })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    )
  }

  const s = settings ?? {}

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuracoes da Empresa</h1>
          <p className="text-sm text-muted-foreground">
            Dados cadastrais que identificam a empresa no sistema (gravados no banco e usados no cabecalho).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Atualizar
        </Button>
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

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Identificacao</h2>
          <Badge variant="secondary">exibida no sistema</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Razao social</Label>
            <Input id="legalName" value={s["company.legalName"] ?? ""} onChange={(e) => set("company.legalName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tradeName">Nome fantasia</Label>
            <Input id="tradeName" value={s["company.tradeName"] ?? ""} onChange={(e) => set("company.tradeName", e.target.value)} placeholder="aparece no cabecalho" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={s["company.cnpj"] ?? ""} onChange={(e) => set("company.cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stateRegistration">Inscricao estadual</Label>
            <Input id="stateRegistration" value={s["company.stateRegistration"] ?? ""} onChange={(e) => set("company.stateRegistration", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={s["company.phone"] ?? ""} onChange={(e) => set("company.phone", e.target.value)} placeholder="(00) 0000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={s["company.email"] ?? ""} onChange={(e) => set("company.email", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="address">Endereco</Label>
            <Input id="address" value={s["company.address"] ?? ""} onChange={(e) => set("company.address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressNumber">Numero</Label>
            <Input id="addressNumber" value={s["company.addressNumber"] ?? ""} onChange={(e) => set("company.addressNumber", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">Bairro</Label>
            <Input id="district" value={s["company.district"] ?? ""} onChange={(e) => set("company.district", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={s["company.city"] ?? ""} onChange={(e) => set("company.city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">UF</Label>
            <Input id="state" value={s["company.state"] ?? ""} onChange={(e) => set("company.state", e.target.value)} maxLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip">CEP</Label>
            <Input id="zip" value={s["company.zipCode"] ?? ""} onChange={(e) => set("company.zipCode", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="size-4 mr-1.5" />
            {saving ? "Salvando..." : "Salvar empresa"}
          </Button>
        </div>
      </form>
    </div>
  )
}
