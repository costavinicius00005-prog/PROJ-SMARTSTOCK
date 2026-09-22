import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

async function forward(request: Request, init: RequestInit = {}) {
  const authorization = request.headers.get("authorization")
  const response = await fetch(`${apiBaseUrl}/api/users`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
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
