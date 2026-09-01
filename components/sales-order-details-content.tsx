"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SalesOrder } from "@/src/domain/sales/sales-document"

export function SalesOrderDetailsContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<SalesOrder | null>(null), [error, setError] = useState("")
  useEffect(() => { fetch(`/api/sales/orders/${orderId}`, { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setOrder(await response.json()) }).catch(() => setError("Nao foi possivel carregar o pedido.")) }, [orderId])
  if (error) return <div className="p-6 text-destructive">{error}</div>
  if (!order) return <div className="grid min-h-full place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
  return <div className="p-6"><div className="mb-5 flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Vendas &gt; Pedidos</p><h1 className="text-2xl font-semibold">Pedido #{order.number}</h1><p className="text-sm text-muted-foreground">Gerado pelo orcamento #{order.sourceQuoteNumber}</p></div><Button asChild variant="outline"><Link href={`/vendas/orcamentos/${order.sourceQuoteId}`}>Abrir orcamento de origem</Link></Button></div>
    <Card className="mb-5"><CardHeader><CardTitle>Dados do pedido</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-4"><Info label="Cliente" value={order.clientName} /><Info label="Emissao" value={order.issueDate} /><Info label="Status" value={<Badge variant="outline">{order.status}</Badge>} /><Info label="Total" value={money(order.total)} /></CardContent></Card>
    <Card><CardHeader><CardTitle>Itens preservados</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Codigo</TableHead><TableHead>Produto</TableHead><TableHead>Unidade</TableHead><TableHead>Quantidade</TableHead><TableHead>Preco</TableHead><TableHead>Desconto</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>{order.items.map((item) => <TableRow key={item.id}><TableCell>{item.productCode}</TableCell><TableCell>{item.productName}</TableCell><TableCell>{item.unitOfMeasure}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{money(item.unitPrice)}</TableCell><TableCell>{money(item.discount)}</TableCell><TableCell className="text-right">{money(item.netSubtotal)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>
}
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 text-sm font-medium">{value}</div></div> }
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
