"use client"

import { ErpLayout } from "@/components/erp-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const locations = [
  { id: 1, name: "Deposito Principal", address: "Rua das Flores, 100 - Centro", products: 28450 },
  { id: 2, name: "Loja Fisica", address: "Av. Brasil, 500 - Comercial", products: 8760 },
  { id: 3, name: "Estoque Reserva", address: "Rua dos Industriais, 30", products: 1100 },
]

export default function StockLocationsPage() {
  return (
    <ErpLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Estoque</span>
          <span>{">"}</span>
          <span className="text-foreground font-medium">Locais de Estoque</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Locais de Estoque</h1>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="size-4" />
            Novo local
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  {loc.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{loc.address}</p>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{loc.products.toLocaleString("pt-BR")}</span> produtos
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ErpLayout>
  )
}
