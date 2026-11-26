import { NextResponse } from "next/server"
import { apiBaseUrl, backendFetch, clearSessionCookie } from "@/lib/server-auth"

export async function GET(request: Request) {
  const response = await backendFetch(request, `${apiBaseUrl}/api/auth/me`, { cache: "no-store" })
  const data = await response.text()
  const result = new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
  // Sessao expirada/encerrada no servidor: remove o cookie que ficou para tras
  if (response.status === 401) clearSessionCookie(result, request)
  return result
}
