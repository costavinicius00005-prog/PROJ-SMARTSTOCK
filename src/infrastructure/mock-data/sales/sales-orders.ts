import type { SalesOrderSummary } from "@/src/domain/sales/sales-order"

export const salesOrders: SalesOrderSummary[] = [
  { id: 1, number: "G1", date: "04/03/2026", client: "MEIRE SOARES MENDONCA MORAIS LTDA", total: "R$ 1.245,00", status: "Orcamento" },
  { id: 2, number: "G2", date: "03/03/2026", client: "JOAO DA SILVA ME", total: "R$ 3.890,00", status: "Faturado" },
  { id: 3, number: "G3", date: "03/03/2026", client: "MARIA SANTOS COMERCIO LTDA", total: "R$ 756,00", status: "Pendente" },
  { id: 4, number: "G4", date: "02/03/2026", client: "CARLOS FERREIRA E CIA", total: "R$ 2.100,00", status: "Faturado" },
  { id: 5, number: "G5", date: "02/03/2026", client: "SMARTSTOCK MATERIAIS ESPORTIVOS", total: "R$ 4.320,00", status: "Cancelado" },
  { id: 6, number: "G6", date: "01/03/2026", client: "DISTRIBUIDORA NORTE SUL LTDA", total: "R$ 8.750,00", status: "Faturado" },
  { id: 7, number: "G7", date: "01/03/2026", client: "LOJA DO ESPORTE EIRELI", total: "R$ 1.960,00", status: "Orcamento" },
]
