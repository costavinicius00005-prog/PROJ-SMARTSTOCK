import { NextResponse } from "next/server"

const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const response = await fetch(`${api}/api/sales/checkout/sales/${id}`, { cache: "no-store" })
  return NextResponse.json(await response.json().catch(() => null), { status: response.status })
}
