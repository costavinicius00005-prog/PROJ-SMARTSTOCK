import type { NavigationItem } from "@/src/domain/navigation/navigation-item"

export const navigationMenu: NavigationItem[] = [
  { title: "Visao Geral", icon: "layout-dashboard", href: "/" },
  {
    title: "Cadastros",
    icon: "users",
    badge: "Novo",
    children: [
      { title: "Produtos", href: "/cadastros/produtos" },
      { title: "Clientes", href: "/cadastros/clientes" },
      { title: "Fornecedores", href: "/cadastros/fornecedores" },
    ],
  },
  {
    title: "Vendas",
    icon: "shopping-cart",
    children: [
      { title: "Caixa Web", href: "/vendas/caixa" },
      { title: "Pedidos de Venda", href: "/vendas/pedidos" },
      { title: "Orcamentos", href: "/vendas/orcamentos" },
    ],
  },
  { title: "Raio X", icon: "bar-chart-3", href: "/raio-x" },
  { title: "Conta Stone", icon: "dollar-sign", href: "/conta-stone" },
  {
    title: "Estoque",
    icon: "package",
    children: [
      { title: "Movimentacoes", href: "/estoque/movimentacoes" },
      { title: "Locais de Estoque", href: "/estoque/locais" },
    ],
  },
  { title: "Relatorios", icon: "bar-chart-3", badge: "Novo", href: "/relatorios" },
  {
    title: "Financeiro",
    icon: "wallet",
    badge: "Novo",
    children: [
      { title: "Contas a Pagar", href: "/financeiro/contas-pagar" },
      { title: "Contas a Receber", href: "/financeiro/contas-receber" },
      { title: "Boletos", href: "/financeiro/boletos" },
      { title: "Mensalidades", href: "/financeiro/mensalidades" },
    ],
  },
  {
    title: "Fiscal",
    icon: "file-text",
    children: [
      { title: "Documentos Fiscais", href: "/fiscal/documentos" },
      { title: "Notas Fiscais", href: "/fiscal/notas" },
    ],
  },
  { title: "Contabilidade", icon: "building-2", href: "/contabilidade" },
  { title: "Configuracoes", icon: "settings", href: "/configuracoes" },
  { title: "Loja de Aplicativos", icon: "store", href: "/aplicativos" },
]
