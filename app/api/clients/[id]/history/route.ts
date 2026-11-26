import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type ClientRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, context: ClientRouteContext) {
  const { id } = await context.params
  const response = await backendFetch(request, `${apiBaseUrl}/api/clients/${id}/history`, { cache: "no-store" })
  const data = await response.text()

  return new NextResponse(data || "[]", {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
