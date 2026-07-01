import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type ProductRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel carregar o produto." },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function PUT(request: Request, context: ProductRouteContext) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel atualizar o produto." },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/products/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel excluir o produto." },
      { status: response.status },
    )
  }

  return new NextResponse(null, { status: 204 })
}
