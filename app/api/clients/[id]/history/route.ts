import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type ClientRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: ClientRouteContext) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/clients/${id}/history`, { cache: "no-store" })
  const data = await response.text()

  return new NextResponse(data || "[]", {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
