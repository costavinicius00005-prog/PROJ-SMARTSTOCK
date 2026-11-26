import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.text()

  const response = await backendFetch(request, `${apiBaseUrl}/api/finance/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
