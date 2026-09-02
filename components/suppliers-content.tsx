"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Mail, MoreVertical, Phone, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { RegisteredSupplier } from "@/src/domain/partners/registered-supplier"
import { entityStatusClassName } from "@/src/presentation/formatters/status-styles"

export function SuppliersContent() {
  const [search, setSearch] = useState("")
  const [suppliers, setSuppliers] = useState<RegisteredSupplier[]>([])
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setStatus("loading")
      try {
        const response = await fetch("/api/suppliers", { cache: "no-store" })
        if (!response.ok) throw new Error()
        setSuppliers(await response.json() as RegisteredSupplier[])
        setStatus("loaded")
      } catch { setStatus("error") }
    }
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return suppliers
    return suppliers.filter((supplier) =>
      [supplier.name, supplier.cpf, supplier.cnpj, supplier.email, supplier.primaryPhone, supplier.city]
        .some((value) => (value ?? "").toLowerCase().includes(query)))
  }, [search, suppliers])

  async function deleteSupplier(supplier: RegisteredSupplier) {
    if (!window.confirm(`Excluir o fornecedor "${supplier.name}"?`)) return
    setDeletingId(supplier.id)
    try {
      const response = await fetch(`/api/suppliers/${supplier.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      setSuppliers((current) => current.filter(({ id }) => id !== supplier.id))
    } catch { setStatus("error") } finally { setDeletingId(null) }
  }

  return <div className="p-6">
    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><span>Cadastros</span><span>{">"}</span><span className="font-medium text-foreground">Fornecedores</span></div>
    <div className="mb-4 flex items-center justify-between">
      <div className="relative w-80"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome ou CPF/CNPJ" value={search} onChange={(event) => setSearch(event.target.value)} className="bg-card pl-9" /></div>
      <Button asChild className="gap-2"><Link href="/cadastros/fornecedores/novo"><Plus className="size-4" />Novo fornecedor</Link></Button>
    </div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-lg">Fornecedores cadastrados</CardTitle></CardHeader><CardContent className="p-0">
      <Table><TableHeader><TableRow><TableHead className="pl-4">Nome</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Telefone</TableHead><TableHead>E-mail</TableHead><TableHead>Cidade</TableHead><TableHead>Situacao</TableHead><TableHead className="text-center">Acoes</TableHead></TableRow></TableHeader><TableBody>
        {status === "loading" ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Carregando fornecedores...</TableCell></TableRow> : null}
        {status === "error" ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-destructive">Nao foi possivel carregar os fornecedores.</TableCell></TableRow> : null}
        {status === "loaded" && filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Nenhum fornecedor cadastrado.</TableCell></TableRow> : null}
        {status === "loaded" && filtered.map((supplier) => <TableRow key={supplier.id}>
          <TableCell className="pl-4 font-medium">{supplier.name}</TableCell><TableCell>{supplier.cpf ?? supplier.cnpj ?? "-"}</TableCell>
          <TableCell><span className="flex items-center gap-1"><Phone className="size-3" />{supplier.primaryPhone ?? "-"}</span></TableCell><TableCell><span className="flex items-center gap-1"><Mail className="size-3" />{supplier.email ?? "-"}</span></TableCell>
          <TableCell>{[supplier.city, supplier.state].filter(Boolean).join(" - ") || "-"}</TableCell><TableCell><Badge variant="outline" className={entityStatusClassName("Ativo")}>Ativo</Badge></TableCell>
          <TableCell className="text-center"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Ver detalhes</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" disabled={deletingId === supplier.id} onClick={() => deleteSupplier(supplier)}>{deletingId === supplier.id ? <Loader2 className="size-3.5 animate-spin" /> : null}Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
        </TableRow>)}
      </TableBody></Table><div className="border-t bg-primary/5 px-4 py-3 text-sm font-semibold">TOTAL: <span className="font-normal">{filtered.length} Fornecedores</span></div>
    </CardContent></Card>
  </div>
}
