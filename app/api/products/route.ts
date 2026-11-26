import { NextResponse } from "next/server"
import { authHeader, backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function GET(request: Request) {
  const response = await backendFetch(request, `${apiBaseUrl}/api/products`, {
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

  const response = await backendFetch(request, `${apiBaseUrl}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(request),
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
