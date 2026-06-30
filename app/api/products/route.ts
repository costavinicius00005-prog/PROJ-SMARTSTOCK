import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET() {
  const response = await fetch(`${apiBaseUrl}/api/products`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel listar os produtos." },
      { status: response.status },
    )
  }

  const data = await response.json()

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.text()

  const response = await fetch(`${apiBaseUrl}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel cadastrar o produto." },
      { status: response.status },
    )
  }

  const data = await response.json()

  return NextResponse.json(data, { status: 201 })
}
