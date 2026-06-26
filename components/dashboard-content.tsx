"use client"

import Link from "next/link"
import {
  Users,
  ShoppingCart,
  Package,
  Wallet,
  FileText,
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

const quickAccessItems = [
  {
    category: "Cadastros",
    icon: Users,
    color: "bg-primary/10 text-primary",
    links: [
      { title: "Novo fornecedor", href: "/cadastros/fornecedores" },
      { title: "Novo cliente", href: "/cadastros/clientes" },
      { title: "Novo produto", href: "/cadastros/produtos" },
    ],
  },
  {
    category: "Vendas",
    icon: ShoppingCart,
    color: "bg-primary/10 text-primary",
    links: [
      { title: "Fechamento de caixa", href: "/vendas/caixa" },
      { title: "Novo orcamento", href: "/vendas/orcamentos" },
      { title: "Faturamento", href: "/vendas/pedidos" },
    ],
  },
  {
    category: "Estoque",
    icon: Package,
    color: "bg-primary/10 text-primary",
    links: [
      { title: "Nova movimentacao", href: "/estoque/movimentacoes" },
      { title: "Novo local estoque", href: "/estoque/locais" },
    ],
  },
  {
    category: "Financeiro",
    icon: Wallet,
    color: "bg-primary/10 text-primary",
    links: [
      { title: "Novo boleto", href: "/financeiro/boletos" },
      { title: "Nova conta a pagar", href: "/financeiro/contas-pagar" },
      { title: "Mensalidades", href: "/financeiro/mensalidades" },
      { title: "Nova conta a receber", href: "/financeiro/contas-receber" },
    ],
  },
  {
    category: "Fiscal",
    icon: FileText,
    color: "bg-primary/10 text-primary",
    links: [
      { title: "Emitir nota fiscal", href: "/fiscal/notas" },
      { title: "Lancar documento fiscal", href: "/fiscal/documentos" },
    ],
  },
]

const kpiData = [
  {
    title: "Vendas Hoje",
    value: "R$ 12.450,00",
    change: "+12,5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Pedidos Pendentes",
    value: "23",
    change: "-5,2%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    title: "Produtos em Estoque",
    value: "38.310",
    change: "+2,1%",
    trend: "up",
    icon: Package,
  },
  {
    title: "Faturamento Mensal",
    value: "R$ 284.500,00",
    change: "+8,3%",
    trend: "up",
    icon: TrendingUp,
  },
]

export function DashboardContent() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Bem-vindo(a), admin!</h1>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisa rapida"
            className="pl-9 h-9 bg-card"
          />
        </div>
      </div>

      <Tabs defaultValue="inicio" className="mb-6">
        <TabsList>
          <TabsTrigger value="inicio" className="gap-1.5">
            Inicio
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpiData.map((kpi) => (
              <Card key={kpi.title} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                      <kpi.icon className="size-4 text-primary" />
                    </div>
                    <span
                      className={`text-xs font-medium flex items-center gap-0.5 ${
                        kpi.trend === "up" ? "text-[#22c55e]" : "text-destructive"
                      }`}
                    >
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownRight className="size-3" />
                      )}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Acesso rapido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickAccessItems.map((section) => (
                  <div key={section.category}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 mb-3">
                      <section.icon className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{section.category}</h3>
                    </div>
                    <div className="flex flex-col gap-1">
                      {section.links.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary hover:bg-accent/30 px-3 py-1.5 rounded-md transition-colors"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Vendas dos Ultimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {[65, 40, 80, 55, 90, 70, 85].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-[#22c55e]/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-bold text-foreground">R$ 284.500,00</p>
                    </div>
                    <ArrowUpRight className="size-5 text-[#22c55e]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-lg font-bold text-foreground">R$ 156.200,00</p>
                    </div>
                    <ArrowDownRight className="size-5 text-destructive" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-primary/10">
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Liquido</p>
                      <p className="text-lg font-bold text-foreground">R$ 128.300,00</p>
                    </div>
                    <TrendingUp className="size-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
