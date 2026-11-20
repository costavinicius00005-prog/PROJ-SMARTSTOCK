import { NextResponse } from "next/server"

const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET(request: Request) {
  const limit = new URL(request.url).searchParams.get("limit") ?? "50"
  const response = await fetch(`${api}/api/sales/checkout/sales?limit=${encodeURIComponent(limit)}`, { cache: "no-store" })
  return NextResponse.json(await response.json().catch(() => null), { status: response.status })
}
