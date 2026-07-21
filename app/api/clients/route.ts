import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET() {
  const response = await fetch(`${apiBaseUrl}/api/clients`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel listar os clientes." },
      { status: response.status },
    )
  }

  const data = await response.json()

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.text()

  const response = await fetch(`${apiBaseUrl}/api/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    const message = response.status === 409
      ? data?.message ?? "Ja existe um cliente cadastrado com este documento."
      : "Nao foi possivel cadastrar o cliente."

    return NextResponse.json(
      { message },
      { status: response.status },
    )
  }

  const data = await response.json()

  return NextResponse.json(data, { status: 201 })
}
