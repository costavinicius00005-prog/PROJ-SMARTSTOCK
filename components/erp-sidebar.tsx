"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  DollarSign,
  Wallet,
  FileText,
  Building2,
  Settings,
  ChevronDown,
  Package,
  Store,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Visao Geral",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Cadastros",
    icon: Users,
    badge: "Novo",
    children: [
      { title: "Produtos", href: "/cadastros/produtos" },
      { title: "Clientes", href: "/cadastros/clientes" },
      { title: "Fornecedores", href: "/cadastros/fornecedores" },
    ],
  },
  {
    title: "Vendas",
    icon: ShoppingCart,
    children: [
      { title: "Pedidos de Venda", href: "/vendas/pedidos" },
      { title: "Orcamentos", href: "/vendas/orcamentos" },
      { title: "Fechamento de Caixa", href: "/vendas/caixa" },
    ],
  },
  {
    title: "Raio X",
    icon: BarChart3,
    href: "/raio-x",
  },
  {
    title: "Conta Stone",
    icon: DollarSign,
    href: "/conta-stone",
  },
  {
    title: "Estoque",
    icon: Package,
    children: [
      { title: "Movimentacoes", href: "/estoque/movimentacoes" },
      { title: "Locais de Estoque", href: "/estoque/locais" },
    ],
  },
  {
    title: "Relatorios",
    icon: BarChart3,
    badge: "Novo",
    href: "/relatorios",
  },
  {
    title: "Financeiro",
    icon: Wallet,
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
    icon: FileText,
    children: [
      { title: "Documentos Fiscais", href: "/fiscal/documentos" },
      { title: "Notas Fiscais", href: "/fiscal/notas" },
    ],
  },
  {
    title: "Contabilidade",
    icon: Building2,
    href: "/contabilidade",
  },
  {
    title: "Configuracoes",
    icon: Settings,
    href: "/configuracoes",
  },
  {
    title: "Loja de Aplicativos",
    icon: Store,
    href: "/aplicativos",
  },
]

export function ErpSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground">SmartStock</span>
            <span className="text-xs text-muted-foreground">SMARTSTOCK</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.children) {
                  return (
                    <Collapsible key={item.title} defaultOpen={item.children.some(c => pathname.startsWith(c.href))}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <item.icon className="size-4 text-muted-foreground" />
                              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                            </span>
                            <span className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                              {item.badge && (
                                <Badge className="bg-[#22c55e] text-[#ffffff] text-[10px] px-1.5 py-0 h-4 border-0">
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.title}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                                    pathname === child.href
                                      ? "text-primary font-medium bg-accent"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                  }`}
                                >
                                  {child.title}
                                </Link>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href!}>
                        <item.icon className="size-4 text-muted-foreground" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-[#22c55e] text-[#ffffff] text-[10px] px-1.5 py-0 h-4 border-0 group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
