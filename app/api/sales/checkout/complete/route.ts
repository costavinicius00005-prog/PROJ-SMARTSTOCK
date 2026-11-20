import { NextResponse } from "next/server"
import { authHeader } from "@/lib/server-auth"

const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function POST(request: Request) {
  const response = await fetch(`${api}/api/sales/checkout/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(request) },
    body: await request.text(),
  })
  return NextResponse.json(await response.json().catch(() => null), { status: response.status })
}
