export type SessionUser = {
  id: number
  username: string
  displayName: string
  role: string
  active: boolean
  createdAt?: string
}

/**
 * O token de sessao fica somente no cookie HttpOnly gravado pelo servidor (Next): o JavaScript da
 * pagina nao le, nao grava e nao envia o token. O navegador manda o cookie sozinho nas chamadas
 * para /api. No localStorage fica apenas o perfil exibido na tela (nome e papel), sem segredo.
 */
const USER_STORAGE = "smartstock_user"
const LEGACY_TOKEN_COOKIE = "smartstock_token"

export function clearSession() {
  try {
    localStorage.removeItem(USER_STORAGE)
  } catch {
    /* armazenamento indisponivel */
  }
}

export function storeUser(user: SessionUser) {
  try {
    localStorage.setItem(USER_STORAGE, JSON.stringify(user))
  } catch {
    /* armazenamento indisponivel */
  }
}

export function readStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(USER_STORAGE)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

/** Remove o cookie antigo (nao HttpOnly) das versoes anteriores, se ainda existir no navegador. */
export function dropLegacyTokenCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${LEGACY_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")

  const response = await fetch(path, { ...init, headers, credentials: "same-origin" })

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `Erro ${response.status}`
    throw new Error(message)
  }

  return data
}

export async function login(username: string, password: string): Promise<SessionUser> {
  const data = (await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "X-SmartStock-Client": "web" },
    body: JSON.stringify({ username, password }),
  })) as { id: number; email: string; userName: string; role: string; active: boolean }

  const user: SessionUser = {
    id: data.id,
    username: data.email,
    displayName: data.userName,
    role: data.role,
    active: data.active,
  }
  storeUser(user)
  return user
}

export async function logoutRequest() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined)
  clearSession()
}

export async function fetchMe(): Promise<SessionUser> {
  return (await apiFetch("/api/auth/me")) as SessionUser
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return (await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  })) as { ok: boolean; otherSessionsRevoked: number }
}
