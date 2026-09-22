"use client"

import * as React from "react"
import { Bell, Menu, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ErpHeader() {
  const { toggleSidebar } = useSidebar()
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [companyName, setCompanyName] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        const name = settings["company.tradeName"] ?? settings["company.legalName"] ?? ""
        if (name) setCompanyName(name)
      })
      .catch(() => undefined)
  }, [])

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={toggleSidebar}>
          <Menu className="size-4" />
          <span className="sr-only">Alternar menu</span>
        </Button>
        <span className="text-sm font-medium text-foreground truncate">
          {companyName ?? "SMARTSTOCK"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8 relative">
          <Bell className="size-4 text-muted-foreground" />
          <span className="sr-only">Notificacoes</span>
        </Button>

        {!loading && !user && (
          <Button variant="default" size="sm" onClick={() => router.push("/login")}>
            Entrar
          </Button>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.username} · {user.role}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
