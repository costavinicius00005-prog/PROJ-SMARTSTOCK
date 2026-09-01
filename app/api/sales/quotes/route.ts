import { NextResponse } from "next/server"
const api = process.env.API_INTERNAL_URL ?? "http://localhost:8080"
export async function GET() { const response = await fetch(`${api}/api/sales/quotes`, { cache: "no-store" }); return relay(response) }
export async function POST(request: Request) {
  const convert = new URL(request.url).searchParams.get("convert") === "true"
  const response = await fetch(`${api}/api/sales/quotes?convert=${convert}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() })
  return relay(response)
}
async function relay(response: Response) { const data = await response.json().catch(() => null); return NextResponse.json(data, { status: response.status }) }
