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
import { appUseCases } from "@/src/composition/use-cases"
import type { NavigationIconKey } from "@/src/domain/navigation/navigation-item"

const navigationIcons: Record<NavigationIconKey, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "shopping-cart": ShoppingCart,
  "bar-chart-3": BarChart3,
  "dollar-sign": DollarSign,
  wallet: Wallet,
  "file-text": FileText,
  "building-2": Building2,
  settings: Settings,
  package: Package,
  store: Store,
}

export function ErpSidebar() {
  const pathname = usePathname()
  const menuItems = appUseCases.listNavigationMenu()

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
                const Icon = navigationIcons[item.icon]

                if (item.children) {
                  return (
                    <Collapsible key={item.title} defaultOpen={item.children.some(c => pathname.startsWith(c.href))}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              <Icon className="size-4 text-muted-foreground" />
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
                        <Icon className="size-4 text-muted-foreground" />
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
