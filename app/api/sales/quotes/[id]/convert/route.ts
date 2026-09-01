import { NextResponse } from "next/server"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const response = await fetch(`${api}/api/sales/quotes/${id}/convert`, { method: "POST" }); const data = await response.json().catch(() => null); return NextResponse.json(data, { status: response.status }) }
