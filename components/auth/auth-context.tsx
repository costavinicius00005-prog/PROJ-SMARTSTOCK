"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { clearSession, fetchMe, getToken, readStoredUser, type SessionUser } from "@/lib/auth-client"

type AuthContextValue = {
  user: SessionUser | null
  loading: boolean
  refresh: () => Promise<void>
  signIn: (user: SessionUser) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  const refresh = React.useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await fetchMe()
      setUser(me)
      setLoading(false)
    } catch {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const signIn = React.useCallback((nextUser: SessionUser) => {
    setUser(nextUser)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    const stored = readStoredUser()
    if (stored) setUser(stored)
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = React.useCallback(() => {
    clearSession()
    setUser(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.")
  }
  return context
}
