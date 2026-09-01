"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MoreVertical, Plus, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SalesQuote } from "@/src/domain/sales/sales-document"

const labels = { DRAFT: "Rascunho", OPEN: "Em aberto", CONVERTED: "Convertido", CANCELLED: "Cancelado", EXPIRED: "Expirado" }
export function SalesQuotesContent() {
  const [quotes, setQuotes] = useState<SalesQuote[]>([]), [search, setSearch] = useState(""), [filter, setFilter] = useState("ALL"), [error, setError] = useState("")
  const load = () => fetch("/api/sales/quotes", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setQuotes(await response.json()) }).catch(() => setError("Nao foi possivel carregar os orcamentos."))
  useEffect(() => { void load() }, [])
  const filtered = useMemo(() => quotes.filter((quote) => (filter === "ALL" || quote.status === filter) && `${quote.number} ${quote.clientName ?? ""}`.toLowerCase().includes(search.toLowerCase())), [quotes, search, filter])
  const cancel = async (id: string) => { if (!window.confirm("Cancelar este orcamento?")) return; const response = await fetch(`/api/sales/quotes/${id}`, { method: "DELETE" }); if (response.ok) load() }
  const convert = async (id: string) => { if (!window.confirm("Transformar este orcamento em pedido de venda?")) return; const response = await fetch(`/api/sales/quotes/${id}/convert`, { method: "POST" }); if (response.ok) load(); else setError((await response.json().catch(() => null))?.message ?? "Nao foi possivel converter.") }
  return <div className="p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Vendas &gt; Orcamentos</p><h1 className="text-2xl font-semibold">Orcamentos</h1></div><Button asChild><Link href="/vendas/orcamentos/novo"><Plus className="size-4" />Novo orcamento</Link></Button></div>
    <div className="mb-4 flex flex-col gap-2 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por numero ou cliente" className="bg-card pl-9" /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full bg-card md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos os status</SelectItem>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
    {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}<Card><CardHeader><CardTitle>Documentos comerciais</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Emissao</TableHead><TableHead>Validade</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Acoes</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Nenhum orcamento encontrado.</TableCell></TableRow> : filtered.map((quote) => <TableRow key={quote.id}><TableCell>#{quote.number}</TableCell><TableCell>{date(quote.issueDate)}</TableCell><TableCell>{quote.validUntil ? date(quote.validUntil) : "-"}</TableCell><TableCell>{quote.clientName ?? "Nao identificado"}</TableCell><TableCell><Badge variant="outline">{labels[quote.status]}</Badge></TableCell><TableCell className="text-right">{money(quote.total)}</TableCell><TableCell className="text-center"><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/vendas/orcamentos/${quote.id}`}>Abrir</Link></DropdownMenuItem>{quote.status === "OPEN" ? <DropdownMenuItem onClick={() => convert(quote.id)}>Transformar em pedido</DropdownMenuItem> : null}{quote.salesOrderId ? <DropdownMenuItem asChild><Link href={`/vendas/pedidos/${quote.salesOrderId}`}>Abrir pedido #{quote.salesOrderNumber}</Link></DropdownMenuItem> : null}{quote.status === "DRAFT" || quote.status === "OPEN" ? <DropdownMenuItem className="text-destructive" onClick={() => cancel(quote.id)}>Cancelar</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>
}
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
