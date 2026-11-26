import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET(request: Request) {
  const response = await backendFetch(request, `${apiBaseUrl}/api/accounting/overview`, {
    cache: "no-store",
  })
  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
