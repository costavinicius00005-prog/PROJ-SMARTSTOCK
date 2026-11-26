import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type SupplierRouteContext = { params: Promise<{ id: string }> }

/** Repassa a resposta do backend (status e corpo), preservando as mensagens de erro. */
async function forward(request: Request, id: string, init: RequestInit = {}) {
  const response = await backendFetch(request, `${apiBaseUrl}/api/suppliers/${id}`, { cache: "no-store", ...init })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const data = await response.text()
  return new NextResponse(data || "{}", {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(request, id)
}

export async function PUT(request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(request, id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  })
}

export async function DELETE(request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(request, id, { method: "DELETE" })
}
