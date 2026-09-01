"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MoreVertical, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SalesOrder } from "@/src/domain/sales/sales-document"

const labels = { OPEN: "Em aberto", CONFIRMED: "Confirmado", FULFILLED: "Atendido", CANCELLED: "Cancelado" }
export function SalesListContent() {
  const [orders, setOrders] = useState<SalesOrder[]>([]), [search, setSearch] = useState(""), [error, setError] = useState("")
  const load = () => fetch("/api/sales/orders", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setOrders(await response.json()) }).catch(() => setError("Nao foi possivel carregar os pedidos."))
  useEffect(() => { void load() }, [])
  const filtered = useMemo(() => orders.filter((order) => `${order.number} ${order.sourceQuoteNumber} ${order.clientName}`.toLowerCase().includes(search.toLowerCase())), [orders, search])
  const cancel = async (id: string) => { if (!window.confirm("Cancelar este pedido? Nenhum estoque sera devolvido, pois o pedido nao movimentou saldo.")) return; const response = await fetch(`/api/sales/orders/${id}`, { method: "DELETE" }); if (response.ok) load() }
  return <div className="p-6"><div className="mb-4"><p className="text-sm text-muted-foreground">Vendas &gt; Pedidos de venda</p><h1 className="text-2xl font-semibold">Pedidos de venda</h1></div><div className="relative mb-4 max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por pedido, orcamento ou cliente" className="bg-card pl-9" /></div>{error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}<Card><CardHeader><CardTitle>Pedidos gerados</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Orcamento</TableHead><TableHead>Emissao</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Acoes</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow> : filtered.map((order) => <TableRow key={order.id}><TableCell>#{order.number}</TableCell><TableCell><Link className="text-primary hover:underline" href={`/vendas/orcamentos/${order.sourceQuoteId}`}>#{order.sourceQuoteNumber}</Link></TableCell><TableCell>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${order.issueDate}T00:00:00Z`))}</TableCell><TableCell>{order.clientName}</TableCell><TableCell><Badge variant="outline">{labels[order.status]}</Badge></TableCell><TableCell className="text-right">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(order.total)}</TableCell><TableCell className="text-center"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/vendas/orcamentos/${order.sourceQuoteId}`}>Abrir orcamento de origem</Link></DropdownMenuItem>{order.status !== "CANCELLED" && order.status !== "FULFILLED" ? <DropdownMenuItem className="text-destructive" onClick={() => cancel(order.id)}>Cancelar pedido</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div>
}
