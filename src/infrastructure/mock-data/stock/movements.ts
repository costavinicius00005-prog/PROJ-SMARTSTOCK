import type { StockMovement, StockSummary } from "@/src/domain/stock/stock-movement"

export const stockSummary: StockSummary = {
  totalProducts: "38.310",
  monthlyEntries: "156",
  monthlyOutputs: "89",
}

export const stockMovements: StockMovement[] = [
  { id: 1, date: "03/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+10 PAR", origin: "NF 257 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "11 PAR" },
  { id: 2, date: "03/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+5 PAR", origin: "NF 256 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "1 PAR" },
  { id: 3, date: "02/03/2026", product: "CHUTEIRA SOCIETY BRASIL 70 PRO", type: "Saida", quantity: "-2 PARES", origin: "Pedido #G2 - JOAO DA SILVA ME", stock: "1 PARES" },
  { id: 4, date: "02/03/2026", product: "BOTA FEM. DE USO COMUM C/ SOLA SINT.", type: "Entrada", quantity: "+8 PAR", origin: "NF 255 - MEIRE SOARES MENDONCA MORAIS LTDA", stock: "6 PAR" },
  { id: 5, date: "01/03/2026", product: "TENIS CORRIDA ULTRA BOOST", type: "Saida", quantity: "-3 PAR", origin: "Pedido #G6 - DISTRIBUIDORA NORTE SUL", stock: "12 PAR" },
  { id: 6, date: "01/03/2026", product: "CHUTEIRA SOCIETY BRASIL 70 PRO", type: "Entrada", quantity: "+5 PARES", origin: "NF 250 - CALCADOS BRASIL LTDA", stock: "3 PARES" },
]
