import type { DashboardOverview } from "@/src/domain/dashboard/dashboard"

export const dashboardOverview: DashboardOverview = {
  quickAccessItems: [
    {
      category: "Cadastros",
      icon: "users",
      links: [
        { title: "Novo fornecedor", href: "/cadastros/fornecedores" },
        { title: "Novo cliente", href: "/cadastros/clientes" },
        { title: "Novo produto", href: "/cadastros/produtos" },
      ],
    },
    {
      category: "Vendas",
      icon: "shopping-cart",
      links: [
        { title: "Fechamento de caixa", href: "/vendas/caixa" },
        { title: "Novo orcamento", href: "/vendas/orcamentos" },
        { title: "Faturamento", href: "/vendas/pedidos" },
      ],
    },
    {
      category: "Estoque",
      icon: "package",
      links: [
        { title: "Nova movimentacao", href: "/estoque/movimentacoes" },
        { title: "Novo local estoque", href: "/estoque/locais" },
      ],
    },
    {
      category: "Financeiro",
      icon: "wallet",
      links: [
        { title: "Novo boleto", href: "/financeiro/boletos" },
        { title: "Nova conta a pagar", href: "/financeiro/contas-pagar" },
        { title: "Mensalidades", href: "/financeiro/mensalidades" },
        { title: "Nova conta a receber", href: "/financeiro/contas-receber" },
      ],
    },
    {
      category: "Fiscal",
      icon: "file-text",
      links: [
        { title: "Emitir nota fiscal", href: "/fiscal/notas" },
        { title: "Lancar documento fiscal", href: "/fiscal/documentos" },
      ],
    },
  ],
  kpis: [
    { title: "Vendas Hoje", value: "R$ 12.450,00", change: "+12,5%", trend: "up", icon: "dollar-sign" },
    { title: "Pedidos Pendentes", value: "23", change: "-5,2%", trend: "down", icon: "shopping-cart" },
    { title: "Produtos em Estoque", value: "38.310", change: "+2,1%", trend: "up", icon: "package" },
    { title: "Faturamento Mensal", value: "R$ 284.500,00", change: "+8,3%", trend: "up", icon: "trending-up" },
  ],
  salesLastSevenDays: [
    { label: "Seg", height: 65 },
    { label: "Ter", height: 40 },
    { label: "Qua", height: 80 },
    { label: "Qui", height: 55 },
    { label: "Sex", height: 90 },
    { label: "Sab", height: 70 },
    { label: "Dom", height: 85 },
  ],
  financialOverview: [
    { label: "Receitas", value: "R$ 284.500,00", tone: "success" },
    { label: "Despesas", value: "R$ 156.200,00", tone: "danger" },
    { label: "Lucro Liquido", value: "R$ 128.300,00", tone: "primary" },
  ],
}
