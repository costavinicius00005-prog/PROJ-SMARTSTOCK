import { NextResponse } from "next/server"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
export async function GET() { const response = await fetch(`${api}/api/sales/orders`, { cache: "no-store" }); const data = await response.json().catch(() => null); return NextResponse.json(data, { status: response.status }) }
