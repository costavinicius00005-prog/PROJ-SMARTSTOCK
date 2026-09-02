import { NextResponse } from "next/server"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
export async function GET() { const response = await fetch(`${api}/api/sales/checkout/payment-methods`, { cache: "no-store" }); return NextResponse.json(await response.json().catch(() => null), { status: response.status }) }
