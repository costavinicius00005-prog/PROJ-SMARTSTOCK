import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await backendFetch(request, `${apiBaseUrl}/api/stock/locations/${id}`, {
    method: "DELETE",
  })
  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
