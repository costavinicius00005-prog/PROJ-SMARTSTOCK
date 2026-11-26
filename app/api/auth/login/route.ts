import { NextResponse } from "next/server"
import { apiBaseUrl, backendFetch, setSessionCookie } from "@/lib/server-auth"

/**
 * Login do ERP web: grava o token em cookie HttpOnly e NAO devolve o token no corpo para o
 * navegador (cabecalho X-SmartStock-Client: web). Outros clientes recebem o corpo original.
 */
export async function POST(request: Request) {
  const body = await request.text()

  const response = await backendFetch(request, `${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  const text = await response.text()
  const headers: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store" }
  const retryAfter = response.headers.get("retry-after")
  if (retryAfter) headers["Retry-After"] = retryAfter

  if (!response.ok) {
    return new NextResponse(text, { status: response.status, headers })
  }

  const data = JSON.parse(text) as { token: string; expiresAt?: string } & Record<string, unknown>
  const isWebClient = request.headers.get("x-smartstock-client") === "web"
  const { token, ...user } = data
  const maxAge = data.expiresAt ? (new Date(data.expiresAt).getTime() - Date.now()) / 1000 : 12 * 3600

  const result = NextResponse.json(isWebClient ? user : data, { headers })
  setSessionCookie(result, request, token, maxAge)
  return result
}
