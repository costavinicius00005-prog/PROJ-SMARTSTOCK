"use client"

import { Bell, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ErpHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" onClick={toggleSidebar}>
          <Menu className="size-4" />
          <span className="sr-only">Alternar menu</span>
        </Button>
        <span className="text-sm font-medium text-foreground">SMARTSTOCK</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8 relative">
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificacoes</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
