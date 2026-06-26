"use client"

import { ErpLayout } from "@/components/erp-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const notas = [
  { id: 1, number: "NF-001234", date: "03/03/2026", client: "JOAO DA SILVA ME", value: "R$ 3.890,00", status: "Autorizada" },
  { id: 2, number: "NF-001233", date: "02/03/2026", client: "CARLOS FERREIRA E CIA", value: "R$ 2.100,00", status: "Autorizada" },
  { id: 3, number: "NF-001232", date: "01/03/2026", client: "DISTRIBUIDORA NORTE SUL LTDA", value: "R$ 8.750,00", status: "Autorizada" },
  { id: 4, number: "NF-001231", date: "28/02/2026", client: "LOJA DO ESPORTE EIRELI", value: "R$ 1.960,00", status: "Cancelada" },
]

export default function FiscalNotasPage() {
  return (
    <ErpLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Fiscal</span>
          <span>{">"}</span>
          <span className="text-foreground font-medium">Notas Fiscais</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">Notas Fiscais</h1>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="size-4" />
            Emitir nota fiscal
          </Button>
        </div>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Notas emitidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 text-foreground font-medium">Numero</TableHead>
                  <TableHead className="text-foreground font-medium">Data</TableHead>
                  <TableHead className="text-foreground font-medium">Cliente</TableHead>
                  <TableHead className="text-right text-foreground font-medium">Valor</TableHead>
                  <TableHead className="text-foreground font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((nota) => (
                  <TableRow key={nota.id} className="hover:bg-muted/30">
                    <TableCell className="pl-4 text-sm font-medium text-foreground">{nota.number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{nota.date}</TableCell>
                    <TableCell className="text-sm text-foreground">{nota.client}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">{nota.value}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          nota.status === "Autorizada"
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {nota.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ErpLayout>
  )
}
