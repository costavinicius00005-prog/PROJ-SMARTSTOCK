export type SessionUser = {
  id: number
  username: string
  displayName: string
  role: string
  active: boolean
  createdAt?: string
}

const TOKEN_COOKIE = "smartstock_token"
const USER_STORAGE = "smartstock_user"

export function getToken(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function setToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`
}

export function clearSession() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  localStorage.removeItem(USER_STORAGE)
}

export function storeUser(user: SessionUser) {
  localStorage.setItem(USER_STORAGE, JSON.stringify(user))
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

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(path, { ...init, headers })

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
    body: JSON.stringify({ username, password }),
  })) as { token: string; id: number; email: string; userName: string; role: string; active: boolean }

  setToken(data.token)
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

export async function fetchMe(): Promise<SessionUser> {
  return (await apiFetch("/api/auth/me")) as SessionUser
}
