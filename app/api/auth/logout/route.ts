import { NextResponse } from "next/server"
import { apiBaseUrl, backendFetch, clearSessionCookie } from "@/lib/server-auth"

/** Encerra a sessao no servidor (o token deixa de valer) e apaga o cookie HttpOnly. */
export async function POST(request: Request) {
  await backendFetch(request, `${apiBaseUrl}/api/auth/logout`, { method: "POST", cache: "no-store" }).catch(
    () => undefined,
  )
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response, request)
  return response
}
