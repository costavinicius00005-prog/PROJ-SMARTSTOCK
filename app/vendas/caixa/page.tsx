"use client"

import { ErpLayout } from "@/components/erp-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Receipt, CreditCard, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CashClosingPage() {
  return (
    <ErpLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Vendas</span>
          <span>{">"}</span>
          <span className="text-foreground font-medium">Fechamento de Caixa</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Fechamento de Caixa</h1>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Fechar caixa do dia
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-[#22c55e]/10">
                  <DollarSign className="size-4 text-[#22c55e]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dinheiro</p>
                  <p className="text-lg font-bold text-foreground">R$ 3.250,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                  <CreditCard className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cartao</p>
                  <p className="text-lg font-bold text-foreground">R$ 8.450,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-[#f59e0b]/10">
                  <Receipt className="size-4 text-[#f59e0b]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PIX</p>
                  <p className="text-lg font-bold text-foreground">R$ 750,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total do Dia</p>
                  <p className="text-lg font-bold text-foreground">R$ 12.450,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Resumo do dia - 03/03/2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Vendas realizadas</span>
                <span className="text-sm font-medium text-foreground">18</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Ticket medio</span>
                <span className="text-sm font-medium text-foreground">R$ 691,67</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Descontos concedidos</span>
                <span className="text-sm font-medium text-destructive">- R$ 340,00</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-foreground">Total liquido</span>
                <span className="text-sm font-bold text-[#22c55e]">R$ 12.110,00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErpLayout>
  )
}
