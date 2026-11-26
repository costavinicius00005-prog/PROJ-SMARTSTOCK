import type { NavigationItem } from "@/src/domain/navigation/navigation-item"

const FINANCE_ROLES = ["ADMIN", "FINANCEIRO"]

export const navigationMenu: NavigationItem[] = [
  { title: "Visao Geral", icon: "layout-dashboard", href: "/" },
  {
    title: "Cadastros",
    icon: "users",
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
  { title: "Entregas e Rotas", icon: "truck", href: "/entregas" },
  {
    title: "Estoque",
    icon: "package",
    children: [
      { title: "Movimentacoes", href: "/estoque/movimentacoes" },
      { title: "Locais de Estoque", href: "/estoque/locais" },
    ],
  },
  { title: "Relatorios", icon: "bar-chart-3", href: "/relatorios" },
  {
    title: "Financeiro",
    icon: "wallet",
    children: [
      { title: "Contas a Pagar", href: "/financeiro/contas-pagar", roles: FINANCE_ROLES },
      { title: "Contas a Receber", href: "/financeiro/contas-receber", roles: FINANCE_ROLES },
      { title: "Crediario", href: "/financeiro/crediario" },
      { title: "Relatorios de Crediario", href: "/financeiro/crediario/relatorios" },
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
  { title: "Contabilidade", icon: "building-2", href: "/contabilidade", roles: FINANCE_ROLES },
  {
    title: "Configuracoes",
    icon: "settings",
    roles: ["ADMIN"],
    children: [
      { title: "Dados da Empresa", href: "/configuracoes" },
      { title: "Usuarios e Permissoes", href: "/admin" },
      { title: "Integracao e Banco", href: "/admin/integracao" },
      { title: "Seguranca e LGPD", href: "/admin/seguranca" },
    ],
  },
]
