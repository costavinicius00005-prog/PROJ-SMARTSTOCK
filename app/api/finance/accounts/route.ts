import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

async function forward(request: Request, init: RequestInit = {}) {
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const query = type ? `?type=${encodeURIComponent(type)}` : ""
  const response = await backendFetch(request, `${apiBaseUrl}/api/finance/accounts${query}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET(request: Request) {
  return forward(request)
}

export async function POST(request: Request) {
  const body = await request.text()
  return forward(request, { method: "POST", body })
}
