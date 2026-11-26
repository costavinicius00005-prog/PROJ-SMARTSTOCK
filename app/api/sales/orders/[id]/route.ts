import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) { const { id } = await params; const response = await backendFetch(request, `${api}/api/sales/orders/${id}`, { cache: "no-store" }); return NextResponse.json(await response.json().catch(() => null), { status: response.status }) }
export async function DELETE(request: Request, { params }: Context) { const { id } = await params; const response = await backendFetch(request, `${api}/api/sales/orders/${id}`, { method: "DELETE" }); return response.status === 204 ? new NextResponse(null, { status: 204 }) : NextResponse.json(await response.json().catch(() => null), { status: response.status }) }
