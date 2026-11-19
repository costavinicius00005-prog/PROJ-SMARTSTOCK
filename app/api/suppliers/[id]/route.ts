import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type SupplierRouteContext = { params: Promise<{ id: string }> }

/** Repassa a resposta do backend (status e corpo), preservando as mensagens de erro. */
async function forward(id: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}/api/suppliers/${id}`, { cache: "no-store", ...init })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const data = await response.text()
  return new NextResponse(data || "{}", {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(_request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(id)
}

export async function PUT(request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  })
}

export async function DELETE(_request: Request, context: SupplierRouteContext) {
  const { id } = await context.params
  return forward(id, { method: "DELETE" })
}
