import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
export async function GET(request: Request) { const response = await backendFetch(request, `${api}/api/sales/orders`, { cache: "no-store" }); const data = await response.json().catch(() => null); return NextResponse.json(data, { status: response.status }) }
