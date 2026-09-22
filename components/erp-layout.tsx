"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ErpSidebar } from "@/components/erp-sidebar"
import { ErpHeader } from "@/components/erp-header"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/auth/auth-context"

export function ErpLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    )
  }

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
