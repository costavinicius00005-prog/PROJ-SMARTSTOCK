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
import { appUseCases } from "@/src/composition/use-cases"
import type { DashboardIconKey } from "@/src/domain/dashboard/dashboard"

const dashboardIcons: Record<DashboardIconKey, React.ComponentType<{ className?: string }>> = {
  users: Users,
  "shopping-cart": ShoppingCart,
  package: Package,
  wallet: Wallet,
  "file-text": FileText,
  "dollar-sign": DollarSign,
  "trending-up": TrendingUp,
}

export function DashboardContent() {
  const { quickAccessItems, kpis, salesLastSevenDays, financialOverview } = appUseCases.getDashboardOverview()

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
            {kpis.map((kpi) => {
              const Icon = dashboardIcons[kpi.icon]

              return (
                <Card key={kpi.title} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                        <Icon className="size-4 text-primary" />
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
              )
            })}
          </div>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-foreground">Acesso rapido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickAccessItems.map((section) => {
                  const Icon = dashboardIcons[section.icon]

                  return (
                    <div key={section.category}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/50 mb-3">
                        <Icon className="size-4 text-primary" />
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
                  )
                })}
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
                  {salesLastSevenDays.map((point) => (
                    <div key={point.label} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${point.height}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{point.label}</span>
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
                  {financialOverview.map((item) => {
                    const isSuccess = item.tone === "success"
                    const isDanger = item.tone === "danger"
                    const Icon = isSuccess ? ArrowUpRight : isDanger ? ArrowDownRight : TrendingUp

                    return (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between p-3 rounded-md ${
                          isSuccess ? "bg-[#22c55e]/10" : isDanger ? "bg-destructive/10" : "bg-primary/10"
                        }`}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-lg font-bold text-foreground">{item.value}</p>
                        </div>
                        <Icon className={`size-5 ${isSuccess ? "text-[#22c55e]" : isDanger ? "text-destructive" : "text-primary"}`} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
