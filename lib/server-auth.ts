import { NextResponse } from "next/server"

/**
 * Sessao do ERP web:
 * - O token fica no cookie "smartstock_token" com HttpOnly (JavaScript da pagina nao consegue ler,
 *   entao um XSS nao rouba a sessao), SameSite=Lax (o cookie nao vai em POST vindo de outro site)
 *   e Secure quando o acesso e por HTTPS (ngrok/cloudflare) ou COOKIE_SECURE=true.
 * - As rotas /api do Next leem o cookie no servidor e repassam o token ao Spring no cabecalho
 *   Authorization. O aplicativo do entregador continua usando o cabecalho Authorization.
 */
export const SESSION_COOKIE = "smartstock_token"

export const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export function authHeader(request: Request): Record<string, string> {
  const authorization = request.headers.get("authorization")
  if (authorization) return { Authorization: authorization }

  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)smartstock_token=([^;]+)/)
  return match ? { Authorization: `Bearer ${decodeURIComponent(match[1])}` } : {}
}

/**
 * fetch para a API Spring Boot levando o token do usuario e a origem real da requisicao
 * (IP e navegador, usados na trilha de auditoria e no limite de tentativas de login).
 */
export function backendFetch(request: Request, input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const auth = authHeader(request)
  if (auth.Authorization && !headers.has("authorization")) headers.set("Authorization", auth.Authorization)

  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")
  if (forwardedFor) headers.set("X-Forwarded-For", forwardedFor)
  const userAgent = request.headers.get("user-agent")
  if (userAgent) headers.set("User-Agent", userAgent)

  return fetch(input, { ...init, headers })
}

/** Repassa a resposta do Spring ao navegador sem alterar status nem corpo. */
export async function proxyToBackend(request: Request, path: string, init: RequestInit = {}) {
  const response = await backendFetch(request, `${apiBaseUrl}${path}`, { cache: "no-store", ...init })
  const body = await response.arrayBuffer()
  const headers = new Headers({ "Content-Type": response.headers.get("content-type") ?? "application/json" })
  const disposition = response.headers.get("content-disposition")
  if (disposition) headers.set("Content-Disposition", disposition)
  headers.set("Cache-Control", "no-store")
  return new NextResponse(body.byteLength ? body : null, { status: response.status, headers })
}

/** Cookie Secure quando o navegador chegou por HTTPS (diretamente ou via tunel). */
export function isHttps(request: Request) {
  if (process.env.COOKIE_SECURE === "true") return true
  if (process.env.COOKIE_SECURE === "false") return false
  const proto = request.headers.get("x-forwarded-proto")
  if (proto) return proto.split(",")[0].trim() === "https"
  return new URL(request.url).protocol === "https:"
}

export function setSessionCookie(response: NextResponse, request: Request, token: string, maxAgeSeconds: number) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(request),
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, Math.floor(maxAgeSeconds)),
  })
}

export function clearSessionCookie(response: NextResponse, request: Request) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isHttps(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
