import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET() {
  const response = await fetch(`${apiBaseUrl}/api/suppliers`, { cache: "no-store" })
  if (!response.ok) {
    return NextResponse.json({ message: "Nao foi possivel listar os fornecedores." }, { status: response.status })
  }
  return NextResponse.json(await response.json())
}

export async function POST(request: Request) {
  const response = await fetch(`${apiBaseUrl}/api/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = response.status === 409
      ? data?.message ?? "Ja existe um fornecedor cadastrado com este documento."
      : "Nao foi possivel cadastrar o fornecedor."
    return NextResponse.json({ message }, { status: response.status })
  }
  return NextResponse.json(await response.json(), { status: 201 })
}
