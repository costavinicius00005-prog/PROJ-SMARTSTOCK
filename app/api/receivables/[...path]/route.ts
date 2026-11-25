import { NextResponse } from "next/server"
import { authHeader } from "@/lib/server-auth"

const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

/**
 * Proxy do modulo de crediario: repassa metodo, caminho, query string, corpo e o token do usuario
 * logado (o backend exige login e valida as permissoes de cada operacao).
 */
async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const search = new URL(request.url).search
  const url = `${api}/api/receivables/${path.map(encodeURIComponent).join("/")}${search}`
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const response = await fetch(url, {
    method: request.method,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...authHeader(request) },
    body: hasBody ? (await request.text()) || "{}" : undefined,
  })
  const text = await response.text()
  return new NextResponse(text || "{}", { status: response.status, headers: { "Content-Type": "application/json" } })
}

export const GET = forward
export const POST = forward
export const PATCH = forward
