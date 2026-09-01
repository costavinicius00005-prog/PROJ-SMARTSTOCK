"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"
import type { RegisteredProduct } from "@/src/domain/catalog/registered-product"
import type { SalesQuote, SaveQuotePayload } from "@/src/domain/sales/sales-document"

type DraftItem = { productId: string; quantity: number; unitPrice: number; discount: number }
const today = () => new Date().toISOString().slice(0, 10)

export function SalesOrderContent({ quoteId }: { quoteId?: string }) {
  const router = useRouter()
  const [clients, setClients] = useState<RegisteredClient[]>([])
  const [products, setProducts] = useState<RegisteredProduct[]>([])
  const [quote, setQuote] = useState<SalesQuote | null>(null)
  const [clientId, setClientId] = useState("")
  const [issueDate, setIssueDate] = useState(today())
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")
  const [generalDiscount, setGeneralDiscount] = useState(0)
  const [freight, setFreight] = useState(0)
  const [items, setItems] = useState<DraftItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/clients", { cache: "no-store" }).then(check).then((r) => r.json()),
      fetch("/api/products", { cache: "no-store" }).then(check).then((r) => r.json()),
      quoteId ? fetch(`/api/sales/quotes/${quoteId}`, { cache: "no-store" }).then(check).then((r) => r.json()) : Promise.resolve(null),
    ]).then(([loadedClients, loadedProducts, loadedQuote]: [RegisteredClient[], RegisteredProduct[], SalesQuote | null]) => {
      setClients(loadedClients); setProducts(loadedProducts)
      if (loadedQuote) {
        setQuote(loadedQuote); setClientId(loadedQuote.clientId ?? ""); setIssueDate(loadedQuote.issueDate)
        setValidUntil(loadedQuote.validUntil ?? ""); setNotes(loadedQuote.notes ?? "")
        setGeneralDiscount(loadedQuote.generalDiscount); setFreight(loadedQuote.freight)
        setItems(loadedQuote.items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount })))
      }
      setStatus("ready")
    }).catch(() => { setMessage("Nao foi possivel carregar os dados comerciais."); setStatus("error") })
  }, [quoteId])

  const editable = !quote || quote.status === "DRAFT" || quote.status === "OPEN"
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const itemDiscount = items.reduce((sum, item) => sum + item.discount, 0)
    return { subtotal, itemDiscount, total: subtotal - itemDiscount - generalDiscount + freight }
  }, [items, generalDiscount, freight])

  const addProduct = () => {
    if (!selectedProduct) return
    const existing = items.find((item) => item.productId === selectedProduct)
    if (existing) setItems(items.map((item) => item.productId === selectedProduct ? { ...item, quantity: item.quantity + 1 } : item))
    else { const product = products.find((item) => item.id === selectedProduct)!; setItems([...items, { productId: product.id, quantity: 1, unitPrice: product.salePrice, discount: 0 }]) }
    setSelectedProduct("")
  }

  const save = async (mode: "DRAFT" | "OPEN" | "CONVERT") => {
    setStatus("saving"); setMessage("")
    const payload: SaveQuotePayload = { clientId: clientId || null, issueDate, validUntil: validUntil || null,
      status: mode === "DRAFT" ? "DRAFT" : "OPEN", notes, generalDiscount, freight, items }
    try {
      const response = await fetch(quoteId ? `/api/sales/quotes/${quoteId}` : `/api/sales/quotes?convert=${mode === "CONVERT"}`,
        { method: quoteId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message ?? "Nao foi possivel salvar o orcamento.")
      if (mode === "CONVERT" && quoteId) {
        if (!window.confirm("Gerar um pedido de venda com os dados atuais deste orcamento?")) { setStatus("ready"); return }
        const converted = await fetch(`/api/sales/quotes/${quoteId}/convert`, { method: "POST" })
        const convertedData = await converted.json().catch(() => null)
        if (!converted.ok) throw new Error(convertedData?.message ?? "Nao foi possivel converter o orcamento.")
      }
      router.push(mode === "CONVERT" ? "/vendas/pedidos" : "/vendas/orcamentos"); router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro inesperado."); setStatus("error") }
  }

  if (status === "loading") return <div className="grid min-h-full place-items-center bg-[#eef1f6]"><Loader2 className="size-6 animate-spin text-primary" /></div>
  return <div className="min-h-full bg-[#eef1f6] p-4 md:p-6"><div className="mx-auto grid max-w-[1580px] gap-5 lg:grid-cols-[280px_1fr]">
    <aside className="self-start rounded-md border bg-card p-4 shadow-sm"><h1 className="mb-4 text-xl font-semibold text-[#17324d]">{quote ? `Orcamento #${quote.number}` : "Novo orcamento"}</h1>
      {quote?.salesOrderNumber ? <p className="mb-4 rounded-sm bg-primary/10 p-3 text-sm text-primary">Pedido gerado: #{quote.salesOrderNumber}</p> : null}
      <div className="grid gap-2">{editable ? <><Button onClick={() => save("DRAFT")} disabled={status === "saving"} variant="outline">Salvar rascunho</Button><Button onClick={() => save("OPEN")} disabled={status === "saving"}>Salvar orcamento</Button><Button onClick={() => save("CONVERT")} disabled={status === "saving"} className="bg-[#22b889] hover:bg-[#1da77c]">Salvar e gerar pedido</Button></> : null}<Button asChild variant="outline"><Link href="/vendas/orcamentos">Cancelar / voltar</Link></Button></div>
    </aside>
    <main className="grid gap-5">
      <Card><CardHeader><CardTitle>Dados gerais e cliente</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">
        <Field label="Cliente"><Select value={clientId} onValueChange={setClientId} disabled={!editable}><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name} {client.cnpj || client.cpf ? `- ${client.cnpj ?? client.cpf}` : ""}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Emissao"><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} disabled={!editable} /></Field><Field label="Validade"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} disabled={!editable} /></Field>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Produtos</CardTitle></CardHeader><CardContent className="grid gap-4">
        {editable ? <div className="flex gap-2"><Select value={selectedProduct} onValueChange={setSelectedProduct}><SelectTrigger className="flex-1"><SelectValue placeholder="Nome, codigo interno ou codigo de barras" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.internalCode} - {product.name} | Disponivel: {product.stockAvailable}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" onClick={addProduct}><Plus className="size-4" />Adicionar</Button></div> : null}
        {items.length === 0 ? <p className="rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum produto adicionado.</p> : null}
        {items.map((item) => { const product = products.find((candidate) => candidate.id === item.productId); const insufficientStock = product !== undefined && product.stockAvailable < item.quantity; const update = (patch: Partial<DraftItem>) => setItems(items.map((current) => current.productId === item.productId ? { ...current, ...patch } : current)); return <div key={item.productId} className={`grid items-end gap-3 rounded-sm border p-3 md:grid-cols-[1fr_110px_130px_130px_130px_40px] ${insufficientStock ? "border-red-300 bg-red-50/60" : ""}`}>
          <div><p className="text-xs text-muted-foreground">Produto</p><p className="text-sm font-medium">{product?.internalCode} - {product?.name}</p><p className={insufficientStock ? "text-xs font-medium text-red-600" : "text-xs text-muted-foreground"}>{product?.unitOfMeasure} · Disponivel: {product?.stockAvailable}{insufficientStock ? " — saldo insuficiente (operacao permitida)" : ""}</p></div>
          <Field label="Quantidade"><Input type="number" min="0.0001" step="0.0001" value={item.quantity} disabled={!editable} onChange={(e) => update({ quantity: Number(e.target.value) })} /></Field><Field label="Preco unitario"><Input type="number" min="0" step="0.01" value={item.unitPrice} disabled={!editable} onChange={(e) => update({ unitPrice: Number(e.target.value) })} /></Field><Field label="Desconto"><Input type="number" min="0" step="0.01" value={item.discount} disabled={!editable} onChange={(e) => update({ discount: Number(e.target.value) })} /></Field>
          <div><p className="text-xs text-muted-foreground">Subtotal</p><p className="h-10 py-2 text-sm font-semibold">{currency(item.quantity * item.unitPrice - item.discount)}</p></div>{editable ? <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((current) => current.productId !== item.productId))}><Trash2 className="size-4 text-destructive" /></Button> : null}
        </div> })}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Valores e observacoes</CardTitle></CardHeader><CardContent className="grid gap-5 lg:grid-cols-2"><Field label="Observacoes"><Textarea value={notes} disabled={!editable} onChange={(e) => setNotes(e.target.value)} className="min-h-28" /></Field><div className="grid gap-3"><div className="grid grid-cols-2 gap-3"><Field label="Desconto geral"><Input type="number" min="0" step="0.01" value={generalDiscount} disabled={!editable} onChange={(e) => setGeneralDiscount(Number(e.target.value))} /></Field><Field label="Frete"><Input type="number" min="0" step="0.01" value={freight} disabled={!editable} onChange={(e) => setFreight(Number(e.target.value))} /></Field></div><div className="grid gap-1 rounded-sm bg-primary/5 p-4 text-sm"><Line label="Subtotal" value={totals.subtotal} /><Line label="Descontos dos itens" value={totals.itemDiscount} /><Line label="Desconto geral" value={generalDiscount} /><Line label="Frete" value={freight} /><div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{currency(totals.total)}</span></div></div></div></CardContent></Card>
      {message ? <p className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</p> : null}
    </main>
  </div></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div> }
function Line({ label, value }: { label: string; value: number }) { return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{currency(value)}</span></div> }
function currency(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) }
function check(response: Response) { if (!response.ok) throw new Error(); return response }
