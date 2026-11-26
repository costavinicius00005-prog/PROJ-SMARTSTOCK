import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { const { id } = await context.params; return relay(await backendFetch(request, `${api}/api/sales/quotes/${id}`, { cache: "no-store" })) }
export async function PUT(request: Request, context: Context) { const { id } = await context.params; return relay(await backendFetch(request, `${api}/api/sales/quotes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: await request.text() })) }
export async function DELETE(request: Request, context: Context) { const { id } = await context.params; const response = await backendFetch(request, `${api}/api/sales/quotes/${id}`, { method: "DELETE" }); return response.status === 204 ? new NextResponse(null, { status: 204 }) : relay(response) }
async function relay(response: Response) { const data = await response.json().catch(() => null); return NextResponse.json(data, { status: response.status }) }
