"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ErpSidebar } from "@/components/erp-sidebar"
import { ErpHeader } from "@/components/erp-header"

export function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ErpSidebar />
      <SidebarInset>
        <ErpHeader />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
