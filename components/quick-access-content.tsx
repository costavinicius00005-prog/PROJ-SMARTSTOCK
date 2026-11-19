"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Home,
  LineChart,
  Search,
  Settings,
  Check,
  Users,
  ShoppingCart,
  Package,
  Wallet,
  FileText,
  LayoutGrid,
  BarChart3,
  Building2,
  DollarSign,
  LayoutDashboard,
  Store,
  Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardContent } from "@/components/dashboard-content"
import { appUseCases } from "@/src/composition/use-cases"
import type { NavigationIconKey } from "@/src/domain/navigation/navigation-item"

const groupIcons: Record<NavigationIconKey, React.ComponentType<{ className?: string }>> = {
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
  truck: Truck,
}

type QuickGroup = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  links: { title: string; href: string }[]
}

const HIDDEN_STORAGE_KEY = "smartstock.quickAccess.hidden"

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

function buildGroups(): QuickGroup[] {
  const menu = appUseCases.listNavigationMenu()
  const groups: QuickGroup[] = menu
    .filter((item) => item.children?.length)
    .map((item) => ({
      title: item.title,
      icon: groupIcons[item.icon],
      links: item.children!,
    }))

  // Itens soltos do menu (sem submenu) ficam agrupados em "Outros"
  const others = menu
    .filter((item) => !item.children && item.href && item.href !== "/")
    .map((item) => ({ title: item.title, href: item.href! }))
  if (others.length) groups.push({ title: "Outros", icon: LayoutGrid, links: others })

  return groups
}

function readHidden(): string[] {
  try {
    const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeHidden(hidden: string[]) {
  try {
    window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hidden))
  } catch {
    // armazenamento indisponivel: a personalizacao vale apenas para a sessao atual
  }
}

export function QuickAccessContent() {
  const router = useRouter()
  const groups = React.useMemo(buildGroups, [])
  const [tab, setTab] = React.useState<"inicio" | "dashboard">("inicio")
  const [query, setQuery] = React.useState("")
  const [editing, setEditing] = React.useState(false)
  const [hidden, setHidden] = React.useState<string[]>([])

  React.useEffect(() => {
    setHidden(readHidden())
  }, [])

  function toggleLink(href: string) {
    setHidden((current) => {
      const next = current.includes(href) ? current.filter((h) => h !== href) : [...current, href]
      writeHidden(next)
      return next
    })
  }

  const term = normalize(query.trim())
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => {
        if (!editing && hidden.includes(link.href)) return false
        if (!term) return true
        return normalize(link.title).includes(term) || normalize(group.title).includes(term)
      }),
    }))
    .filter((group) => group.links.length > 0)

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && term) {
      const first = visibleGroups[0]?.links[0]
      if (first) router.push(first.href)
    }
    if (event.key === "Escape") setQuery("")
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={tab === "inicio" ? "default" : "secondary"}
            className="gap-2 font-semibold"
            onClick={() => setTab("inicio")}
          >
            <Home className="size-4" />
            INÍCIO
          </Button>
          <Button
            size="sm"
            variant={tab === "dashboard" ? "default" : "secondary"}
            className="gap-2 font-semibold"
            onClick={() => setTab("dashboard")}
          >
            <LineChart className="size-4" />
            DASHBOARD
          </Button>
        </div>

        {tab === "inicio" && (
          <label className="flex h-8 w-full items-center gap-2 rounded-md bg-secondary px-3 text-sm text-foreground sm:w-64 focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Pesquisa rápida"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </label>
        )}
      </div>

      {tab === "dashboard" ? (
        <div className="-m-6">
          <DashboardContent />
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">Acesso rápido</CardTitle>
            <Button
              variant={editing ? "default" : "ghost"}
              size="sm"
              className={editing ? "gap-1.5" : "size-8 p-0"}
              onClick={() => setEditing((value) => !value)}
              title={editing ? "Concluir personalização" : "Personalizar atalhos"}
            >
              {editing ? (
                <>
                  <Check className="size-4" />
                  Concluir
                </>
              ) : (
                <Settings className="size-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {editing && (
              <p className="mb-4 text-sm text-muted-foreground">
                Marque os atalhos que devem aparecer na tela inicial.
              </p>
            )}

            {visibleGroups.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {term ? `Nenhum atalho encontrado para "${query}".` : "Nenhum atalho selecionado. Use a engrenagem para escolher."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleGroups.map((group) => {
                  const Icon = group.icon
                  return (
                    <section key={group.title}>
                      <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2">
                        <Icon className="size-4 text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
                      </div>
                      <ul className="mt-1">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            {editing ? (
                              <label className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                                <Checkbox
                                  checked={!hidden.includes(link.href)}
                                  onCheckedChange={() => toggleLink(link.href)}
                                />
                                {link.title}
                              </label>
                            ) : (
                              <Link
                                href={link.href}
                                className="block rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                              >
                                {link.title}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
