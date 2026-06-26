import type { FinancialSummary, PayableAccount, ReceivableAccount } from "@/src/domain/finance/account"

export const financialSummary: FinancialSummary = {
  totalReceivable: "R$ 32.130,00",
  totalPayable: "R$ 26.779,90",
  overdue: "R$ 24.180,00",
  expectedBalance: "R$ 5.350,10",
}

export const payables: PayableAccount[] = [
  { id: 1, description: "Aluguel do espaco comercial", supplier: "Imobiliaria Centro Sul", dueDate: "05/03/2026", value: "R$ 4.500,00", status: "Pendente" },
  { id: 2, description: "Fornecedor - Calcados Esportivos", supplier: "MEIRE SOARES MENDONCA MORAIS LTDA", dueDate: "10/03/2026", value: "R$ 12.340,00", status: "Pendente" },
  { id: 3, description: "Energia eletrica", supplier: "CEMIG", dueDate: "15/03/2026", value: "R$ 890,00", status: "Pendente" },
  { id: 4, description: "Internet empresarial", supplier: "Vivo Empresas", dueDate: "20/03/2026", value: "R$ 299,90", status: "Pago" },
  { id: 5, description: "Fornecedor - Roupas Fitness", supplier: "Distribuidora Norte Sul", dueDate: "01/03/2026", value: "R$ 8.750,00", status: "Vencido" },
]

export const receivables: ReceivableAccount[] = [
  { id: 1, description: "Pedido #G2 - Venda", client: "JOAO DA SILVA ME", dueDate: "10/03/2026", value: "R$ 3.890,00", status: "Pendente" },
  { id: 2, description: "Pedido #G4 - Venda", client: "CARLOS FERREIRA E CIA", dueDate: "15/03/2026", value: "R$ 2.100,00", status: "Pendente" },
  { id: 3, description: "Pedido #G6 - Venda", client: "DISTRIBUIDORA NORTE SUL LTDA", dueDate: "05/03/2026", value: "R$ 8.750,00", status: "Recebido" },
  { id: 4, description: "Pedido #G7 - Venda", client: "LOJA DO ESPORTE EIRELI", dueDate: "20/03/2026", value: "R$ 1.960,00", status: "Pendente" },
  { id: 5, description: "Mensalidade - Cartao", client: "Cartoes diversos", dueDate: "28/02/2026", value: "R$ 15.430,00", status: "Vencido" },
]
