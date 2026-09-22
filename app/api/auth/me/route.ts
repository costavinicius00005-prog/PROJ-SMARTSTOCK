import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization")

  const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
    cache: "no-store",
    headers: authorization ? { Authorization: authorization } : {},
  })

  const data = await response.text()

  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
