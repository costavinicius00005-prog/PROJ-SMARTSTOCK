"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Ban, Check, CircleCheck, History, Loader2, PackageSearch, Plus, Printer, ReceiptText, Search, ShoppingCart,
  Trash2, UserRound, Wallet, X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth/auth-context"
import { SaleReceiptView, type StoreSettings } from "@/components/sale-receipt"
import { toast } from "@/hooks/use-toast"
import type { RegisteredProduct } from "@/src/domain/catalog/registered-product"
import type { RegisteredClient } from "@/src/domain/partners/registered-client"
import type { SalesOrder } from "@/src/domain/sales/sales-document"
import type { PaymentMethod, SaleReceipt } from "@/src/domain/sales/checkout"
import { splitPayments, type PaymentLine } from "@/src/domain/sales/payment-split"
import { CheckoutCreditPanel, defaultCreditPlan, type CreditPlanState } from "@/components/checkout-credit-panel"

type Mode = "products" | "orders" | "sales"
type CartItem = { productId: string; code: string; name: string; unit: string; quantity: number; price: number; discount: number; available: number | null }
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const canInvoice = (order: SalesOrder) => order.status === "OPEN" || order.status === "CONFIRMED"
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
const round2 = (value: number) => Math.round(value * 100) / 100

export function WebCheckoutContent() {
  const params = useSearchParams(), searchRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>("products"), [query, setQuery] = useState("")
  const [products, setProducts] = useState<RegisteredProduct[]>([]), [orders, setOrders] = useState<SalesOrder[]>([])
  const [clients, setClients] = useState<RegisteredClient[]>([]), [methods, setMethods] = useState<PaymentMethod[]>([])
  const [recentSales, setRecentSales] = useState<SaleReceipt[]>([]), [store, setStore] = useState<StoreSettings>({})
  const [cart, setCart] = useState<CartItem[]>([]), [order, setOrder] = useState<SalesOrder | null>(null)
  const [clientId, setClientId] = useState("anonymous"), [generalDiscount, setGeneralDiscount] = useState(0)
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([])
  const [creditPlan, setCreditPlan] = useState<CreditPlanState>(defaultCreditPlan)
  const [creditProblem, setCreditProblem] = useState<string | null>(null)
  const [loading, setLoading] = useState(true), [submitting, setSubmitting] = useState(false), [error, setError] = useState("")
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null)
  const [cancelTarget, setCancelTarget] = useState<SaleReceipt | null>(null), [cancelReason, setCancelReason] = useState(""), [cancelling, setCancelling] = useState(false)

  // Protecao contra envio duplicado: trava sincrona + id unico por tentativa (o backend devolve a mesma venda)
  const submittingRef = useRef(false)
  const requestIdRef = useRef<string | null>(null)

  const loadCatalog = useCallback(async () => {
    const [p, o] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }).then(check).then(r => r.json()),
      fetch("/api/sales/orders", { cache: "no-store" }).then(check).then(r => r.json()),
    ])
    setProducts(p); setOrders(o)
  }, [])
  const loadSales = useCallback(async () => {
    const data = await fetch("/api/sales/checkout/sales?limit=50", { cache: "no-store" }).then(check).then(r => r.json())
    setRecentSales(data)
  }, [])

  useEffect(() => {
    Promise.all([
      loadCatalog(),
      fetch("/api/clients", { cache: "no-store" }).then(check).then(r => r.json()).then(setClients),
      fetch("/api/sales/checkout/payment-methods", { cache: "no-store" }).then(check).then(r => r.json()).then(setMethods),
      fetch("/api/settings", { cache: "no-store" }).then(r => (r.ok ? r.json() : {})).then(setStore).catch(() => undefined),
    ]).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [loadCatalog])
  useEffect(() => { if (mode === "sales") loadSales().catch(e => setError(e.message)) }, [mode, loadSales])
  useEffect(() => { const id = params.get("pedidoId"); if (!id || loading) return; fetch(`/api/sales/orders/${id}`, { cache: "no-store" }).then(check).then(r => r.json()).then(loadOrder).catch(e => setError(e.message)) }, [loading, params])

  // Qualquer alteracao na venda torna a proxima finalizacao uma nova tentativa
  useEffect(() => { requestIdRef.current = null }, [cart, paymentLines, clientId, generalDiscount, order, creditPlan])

  const productResults = useMemo(() => { const term = query.trim().toLocaleLowerCase("pt-BR"); return !term ? [] : products.filter(p => `${p.name} ${p.internalCode} ${p.barcode ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 30) }, [query, products])
  const orderResults = useMemo(() => { const term = query.trim().toLocaleLowerCase("pt-BR"); return !term ? [] : orders.filter(o => canInvoice(o) && `${o.number} ${o.id} ${o.clientName} ${o.clientDocument ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 30) }, [query, orders])
  const salesResults = useMemo(() => { const term = query.trim().toLocaleLowerCase("pt-BR"); return !term ? recentSales : recentSales.filter(s => `${s.number} ${s.clientName ?? ""} ${s.salesOrderNumber ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)) }, [query, recentSales])

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.price, 0), itemDiscount = cart.reduce((sum, i) => sum + i.discount, 0), freight = order?.freight ?? 0
  const total = round2(Math.max(0, subtotal - itemDiscount - generalDiscount + freight))
  const split = useMemo(() => splitPayments(paymentLines, methods, total), [paymentLines, methods, total])
  const stockProblem = cart.find(i => i.available !== null && i.quantity > i.available)
  // Crediario: no maximo uma linha; o valor dela e o financiado
  const creditMethodIds = new Set(methods.filter(m => m.allowsCredit).map(m => m.id))
  const creditLine = paymentLines.find(l => creditMethodIds.has(l.methodId))
  const creditLines = paymentLines.filter(l => creditMethodIds.has(l.methodId)).length
  const creditBlock = creditLine ? (creditLines > 1 ? "Use apenas uma linha de crediario por venda." : !user ? "Faca login para vender no crediario." : creditProblem) : null
  const onCreditStatus = useCallback((problem: string | null) => setCreditProblem(problem), [])
  function applyDownPayment(amount: number, methodId: string) {
    const creditId = creditLine?.methodId ?? methods.find(m => m.allowsCredit)?.id
    if (!creditId) return
    const lines: PaymentLine[] = []
    if (amount > 0) lines.push({ key: newKey(), methodId, value: amount })
    lines.push({ key: newKey(), methodId: creditId, value: round2(total - amount) })
    setPaymentLines(lines)
  }

  function addProduct(product: RegisteredProduct) {
    if (order) return
    setCart(current => { const found = current.find(i => i.productId === product.id); return found ? current.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...current, { productId: product.id, code: product.internalCode, name: product.name, unit: product.unitOfMeasure, quantity: 1, price: product.salePrice, discount: 0, available: product.stockAvailable }] })
    setQuery(""); requestAnimationFrame(() => searchRef.current?.focus())
  }
  function loadOrder(value: SalesOrder) {
    if (!canInvoice(value)) { setError("Este pedido nao esta disponivel para faturamento."); return }
    setOrder(value); setClientId(value.clientId); setGeneralDiscount(value.generalDiscount)
    setCart(value.items.map(i => ({ productId: i.productId, code: i.productCode, name: i.productName, unit: i.unitOfMeasure, quantity: i.quantity, price: i.unitPrice, discount: i.discount, available: null })))
    setPaymentLines([]); setMode("orders"); setQuery(""); setError("")
  }
  function clear() { setOrder(null); setCart([]); setClientId("anonymous"); setGeneralDiscount(0); setPaymentLines([]); setCreditPlan(defaultCreditPlan()); setError(""); setMode("products"); requestIdRef.current = null; searchRef.current?.focus() }

  function addPayment(methodId?: string) {
    const id = methodId ?? methods.find(m => !paymentLines.some(l => l.methodId === m.id))?.id ?? methods[0]?.id ?? ""
    setPaymentLines(lines => [...lines, { key: newKey(), methodId: id, value: round2(split.remaining) }])
  }
  const updatePayment = (key: string, patch: Partial<PaymentLine>) => setPaymentLines(lines => lines.map(l => l.key === key ? { ...l, ...patch } : l))
  const removePayment = (key: string) => setPaymentLines(lines => lines.filter(l => l.key !== key))

  async function complete() {
    if (submittingRef.current) return
    if (!cart.length) return setError("Adicione ao menos um produto.")
    if (!split.canFinish) return setError(split.error ?? "Os pagamentos precisam cobrir exatamente o total da venda.")
    if (stockProblem) return setError(`Estoque insuficiente para ${stockProblem.name}.`)
    if (creditBlock) return setError(creditBlock)
    submittingRef.current = true; setSubmitting(true); setError("")
    requestIdRef.current ??= newKey()
    try {
      const response = await fetch("/api/sales/checkout/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesOrderId: order?.id ?? null, clientId: clientId === "anonymous" ? null : clientId, generalDiscount, notes: order?.notes ?? "",
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, discount: i.discount })),
          payments: split.payments, requestId: requestIdRef.current,
          credit: creditLine ? { installments: creditPlan.installments, intervalType: creditPlan.intervalType, intervalDays: creditPlan.intervalType === "DAYS" ? creditPlan.intervalDays : null, firstDueDate: creditPlan.firstDueDate } : null,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.id) throw new Error(data?.message ?? "Nao foi possivel finalizar a venda. Nada foi registrado.")
      // So chega aqui depois que o backend confirmou a gravacao (venda, pagamentos e estoque)
      const sale = data as SaleReceipt
      const wasOrder = Boolean(order)
      clear()
      setReceipt(sale)
      toast({
        title: wasOrder ? `Pedido nº ${sale.salesOrderNumber} faturado com sucesso` : `Venda nº ${sale.number} finalizada com sucesso`,
        description: `${wasOrder ? `Venda nº ${sale.number} · ` : ""}Total ${money.format(sale.total)} · estoque atualizado.${sale.creditInstallments?.length ? ` Crediario: ${sale.creditInstallments.length} parcela(s), titulo nº ${sale.receivableNumber}.` : ""}`,
      })
      loadCatalog().catch(() => undefined)
      if (mode === "sales") loadSales().catch(() => undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao finalizar a venda.")
      toast({ variant: "destructive", title: "Venda nao finalizada", description: e instanceof Error ? e.message : undefined })
    } finally { submittingRef.current = false; setSubmitting(false) }
  }

  const cancellingRef = useRef(false)
  async function confirmCancel() {
    // Trava sincrona: o estado "cancelling" so atualiza no proximo render, entao um clique duplo passaria
    if (!cancelTarget || cancellingRef.current) return
    cancellingRef.current = true
    setCancelling(true)
    try {
      const response = await fetch(`/api/sales/checkout/sales/${cancelTarget.id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: cancelReason }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message ?? "Nao foi possivel cancelar a venda.")
      toast({ title: `Venda nº ${cancelTarget.number} cancelada`, description: "Os produtos voltaram ao estoque e o cancelamento foi registrado nas movimentacoes." })
      setCancelTarget(null); setCancelReason("")
      await Promise.all([loadSales(), loadCatalog()])
    } catch (e) {
      toast({ variant: "destructive", title: "Cancelamento nao realizado", description: e instanceof Error ? e.message : undefined })
    } finally { cancellingRef.current = false; setCancelling(false) }
  }

  const openPrint = (sale: SaleReceipt, format: "80mm" | "a4") => window.open(`/vendas/comprovante/${sale.id}?imprimir=1&formato=${format}`, "_blank", "noopener")

  return <div className="flex min-h-[calc(100vh-3.5rem)] flex-col gap-4 bg-muted/30 p-4 lg:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">Vendas &gt; Caixa Web</p><h1 className="text-2xl font-semibold">Caixa Web</h1><p className="text-sm text-muted-foreground">Operador: {user?.displayName ?? user?.username ?? "-"}</p></div><Button variant="outline" onClick={clear} disabled={!cart.length || submitting}><X className="size-4" />Limpar venda</Button></div>
    {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</div>}
    <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(560px,1.35fr)]">
      <Card className="min-h-[420px]"><CardHeader className="space-y-3 pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Pesquisa</CardTitle>{loading && <Loader2 className="size-4 animate-spin" />}</div>
        <Tabs value={mode} onValueChange={v => { setMode(v as Mode); setQuery("") }}><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="products"><PackageSearch className="size-4" />Produtos</TabsTrigger><TabsTrigger value="orders"><ReceiptText className="size-4" />Pedidos</TabsTrigger><TabsTrigger value="sales"><History className="size-4" />Vendas</TabsTrigger></TabsList></Tabs>
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input ref={searchRef} autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === "products" ? "Nome, codigo interno ou codigo de barras" : mode === "orders" ? "Numero, codigo ou cliente" : "Numero da venda, pedido ou cliente"} className="pl-9" disabled={!!order && mode !== "sales"} /></div></CardHeader>
        <CardContent className="space-y-2">
          {mode !== "sales" && !query && !loading && <div className="flex min-h-48 flex-col items-center justify-center text-center text-muted-foreground"><Search className="mb-3 size-8" /><p className="font-medium text-foreground">Inicie uma pesquisa</p><p className="max-w-xs text-sm">{mode === "products" ? "Localize produtos por nome, codigo ou codigo de barras." : "Localize pedidos em aberto por numero ou cliente."}</p></div>}
          {mode !== "sales" && query && (mode === "products" ? productResults : orderResults).length === 0 && !loading && <div className="py-16 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</div>}
          {mode === "products" && productResults.map(p => <button key={p.id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"><div><div className="flex items-center gap-2"><span className="font-medium">{p.name}</span><Badge variant="outline">{p.internalCode}</Badge></div><p className="text-xs text-muted-foreground">{p.barcode || "Sem codigo de barras"} · {p.unitOfMeasure} · Estoque {p.stockAvailable}</p></div><div className="text-right"><p className="font-semibold">{money.format(p.salePrice)}</p><Plus className="ml-auto size-4 text-primary" /></div></button>)}
          {mode === "orders" && orderResults.map(o => <button key={o.id} onClick={() => loadOrder(o)} className="flex w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left hover:bg-accent"><div><p className="font-medium">Pedido #{o.number}</p><p className="text-xs text-muted-foreground">{o.clientName} · {new Date(`${o.issueDate}T00:00:00`).toLocaleDateString("pt-BR")}</p></div><div className="text-right"><Badge variant="outline">Disponivel</Badge><p className="mt-1 font-semibold">{money.format(o.total)}</p></div></button>)}
          {mode === "sales" && (salesResults.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma venda encontrada.</div> : salesResults.map(s => <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">Venda #{s.number}</p>{s.salesOrderNumber ? <Badge variant="secondary">Pedido #{s.salesOrderNumber}</Badge> : null}{s.status === "CANCELLED" ? <Badge variant="destructive">Cancelada</Badge> : <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">Concluida</Badge>}</div><p className="truncate text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString("pt-BR")} · {s.clientName || "Consumidor"} · {s.payments.map(p => p.methodName).join(" + ")}</p></div><div className="flex shrink-0 items-center gap-1"><span className="mr-2 font-semibold">{money.format(s.total)}</span><Button size="icon" variant="ghost" aria-label={`Comprovante da venda ${s.number}`} title="Ver / imprimir comprovante" onClick={() => setReceipt(s)}><Printer className="size-4" /></Button>{s.status === "COMPLETED" && <Button size="icon" variant="ghost" aria-label={`Cancelar venda ${s.number}`} title="Cancelar venda" onClick={() => { setCancelTarget(s); setCancelReason("") }}><Ban className="size-4 text-destructive" /></Button>}</div></div>))}
        </CardContent></Card>

      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex min-h-[320px] flex-1 flex-col"><CardHeader className="border-b pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">{order ? `Faturando pedido nº ${order.number}` : "Venda direta"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{cart.length} {cart.length === 1 ? "item" : "itens"} no carrinho</p></div>{order && <Button size="sm" variant="outline" onClick={clear} disabled={submitting}>Remover pedido</Button>}</div><div><Label className="mb-1.5 block text-xs">Cliente</Label><Select value={clientId} onValueChange={setClientId} disabled={!!order}><SelectTrigger><UserRound className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="anonymous">Consumidor nao identificado</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div></CardHeader>
          <CardContent className="flex-1 p-0">
            {!cart.length ? <div className="flex h-60 flex-col items-center justify-center text-muted-foreground"><ShoppingCart className="mb-3 size-9" /><p className="font-medium text-foreground">Carrinho vazio</p><p className="text-sm">Pesquise e adicione um produto.</p></div> : <div className="divide-y">{cart.map(item => <div key={item.productId} className="grid gap-3 p-4 sm:grid-cols-[1fr_100px_110px_110px_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.name}</p><Badge variant="secondary">{item.code}</Badge></div><p className="text-xs text-muted-foreground">{item.unit} · {money.format(item.price)} por unidade{item.available !== null ? ` · disponivel ${item.available}` : ""}</p>{item.available !== null && item.quantity > item.available && <p className="text-xs font-medium text-destructive">Quantidade acima do estoque disponivel</p>}</div><div><Label className="text-xs">Quantidade</Label><Input type="number" min="0.0001" step="0.0001" value={item.quantity} disabled={!!order} onChange={e => setCart(c => c.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(.0001, Number(e.target.value)) } : i))} /></div><div><Label className="text-xs">Desconto</Label><Input type="number" min="0" max={item.quantity * item.price} step="0.01" value={item.discount} disabled={!!order} onChange={e => setCart(c => c.map(i => i.productId === item.productId ? { ...i, discount: Math.min(i.quantity * i.price, Math.max(0, Number(e.target.value))) } : i))} /></div><div className="text-right"><p className="text-xs text-muted-foreground">Subtotal</p><p className="font-semibold">{money.format(item.quantity * item.price - item.discount)}</p>{item.discount > 0 && <p className="text-xs text-muted-foreground">Desconto {money.format(item.discount)}</p>}</div><Button variant="ghost" size="icon" aria-label={`Remover ${item.name}`} disabled={!!order} onClick={() => setCart(c => c.filter(i => i.productId !== item.productId))}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div>}
          </CardContent></Card>

        <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><Wallet className="size-4" />Pagamento</CardTitle><div className="flex flex-wrap gap-1.5">{methods.map(m => <Button key={m.id} type="button" size="sm" variant={m.allowsCredit ? "secondary" : "outline"} disabled={!cart.length || submitting || split.remaining <= 0 || (m.allowsCredit && Boolean(creditLine))} onClick={() => addPayment(m.id)}>{m.name}</Button>)}</div></div></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              {paymentLines.length === 0 ? <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Nenhuma forma de pagamento adicionada. Use os botoes acima ou &quot;Adicionar forma de pagamento&quot; — o valor restante e preenchido automaticamente.</p> : paymentLines.map((line, index) => {
                const method = methods.find(m => m.id === line.methodId)
                return <div key={line.key} className="grid grid-cols-[1fr_130px_auto] items-end gap-2"><div><Label className="text-xs">Forma {index + 1}</Label><Select value={line.methodId} onValueChange={v => updatePayment(line.key, { methodId: v })} disabled={submitting}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{methods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">{method?.allowsChange ? "Valor recebido" : "Valor"}</Label><Input type="number" min="0" step="0.01" inputMode="decimal" value={line.value || ""} disabled={submitting} onChange={e => updatePayment(line.key, { value: Number(e.target.value) })} /></div><Button variant="ghost" size="icon" aria-label={`Remover forma de pagamento ${index + 1}`} disabled={submitting} onClick={() => removePayment(line.key)}><Trash2 className="size-4 text-destructive" /></Button></div>
              })}
              <Button type="button" variant="secondary" size="sm" onClick={() => addPayment()} disabled={!cart.length || submitting || !methods.length}><Plus className="size-4" />Adicionar forma de pagamento</Button>
              {split.error && <p className="text-sm text-destructive">{split.error}</p>}
              {creditLine && <CheckoutCreditPanel clientId={clientId === "anonymous" ? null : clientId} financed={creditLine.value || 0} total={total} plan={creditPlan} onPlanChange={setCreditPlan} methods={methods} onApplyDownPayment={applyDownPayment} onStatusChange={onCreditStatus} disabled={submitting} />}
            </div>
            <div className="min-w-60 space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
              <Line label="Subtotal" value={money.format(subtotal)} />
              {itemDiscount + generalDiscount > 0 && <Line label="Descontos" value={`- ${money.format(itemDiscount + generalDiscount)}`} />}
              {freight > 0 && <Line label="Frete" value={money.format(freight)} />}
              <div className="flex items-baseline justify-between border-t pt-1"><span className="text-muted-foreground">Total</span><span className="text-2xl font-bold text-primary">{money.format(total)}</span></div>
              <Line label="Total pago" value={money.format(split.paid)} />
              <Line label="Restante" value={money.format(split.remaining)} strong={split.remaining > 0} tone={split.remaining > 0 ? "text-destructive" : "text-emerald-600"} />
              {split.change > 0 && <Line label="Troco" value={money.format(split.change)} strong tone="text-emerald-600" />}
              <Button size="lg" className="mt-2 w-full" disabled={!cart.length || submitting || !split.canFinish || Boolean(stockProblem) || Boolean(creditBlock)} onClick={complete}>{submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{submitting ? "Finalizando..." : order ? "Faturar pedido" : "Finalizar venda"}</Button>
            </div>
          </CardContent></Card>
      </div>
    </div>

    <Dialog open={receipt !== null} onOpenChange={open => { if (!open) { setReceipt(null); requestAnimationFrame(() => searchRef.current?.focus()) } }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{receipt?.status === "CANCELLED" ? <Ban className="size-5 text-destructive" /> : <CircleCheck className="size-5 text-emerald-600" />}{receipt?.status === "CANCELLED" ? `Venda nº ${receipt.number} (cancelada)` : `Venda nº ${receipt?.number} registrada`}</DialogTitle>
          <DialogDescription>Comprovante gerado com os dados gravados da venda.</DialogDescription>
        </DialogHeader>
        {receipt && <div className="rounded-md border bg-white"><SaleReceiptView sale={receipt} store={store} /></div>}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => setReceipt(null)}>Fechar</Button>
          <div className="flex gap-2"><Button variant="outline" onClick={() => receipt && openPrint(receipt, "a4")}><Printer className="size-4" />Papel A4</Button><Button onClick={() => receipt && openPrint(receipt, "80mm")}><Printer className="size-4" />Imprimir cupom</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={cancelTarget !== null} onOpenChange={open => { if (!open && !cancelling) setCancelTarget(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar venda nº {cancelTarget?.number}?</DialogTitle>
          <DialogDescription>Os produtos voltam ao estoque e o cancelamento fica registrado nas movimentacoes. A venda e os pagamentos continuam no historico.{cancelTarget?.salesOrderNumber ? ` O pedido nº ${cancelTarget.salesOrderNumber} tambem sera cancelado.` : ""}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5"><Label htmlFor="cancel-reason">Motivo (opcional)</Label><Textarea id="cancel-reason" maxLength={255} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Ex.: cliente desistiu da compra" /></div>
        <DialogFooter><Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>Voltar</Button><Button variant="destructive" onClick={confirmCancel} disabled={cancelling}>{cancelling ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}Cancelar venda</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}

function Line({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={`${strong ? "font-semibold" : ""} ${tone ?? ""}`}>{value}</span></div>
}
async function check(response: Response) { if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.message ?? "Nao foi possivel carregar os dados.") } return response }
