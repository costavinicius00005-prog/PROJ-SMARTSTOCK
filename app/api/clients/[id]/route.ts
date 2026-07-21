import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type ClientRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(_request: Request, context: ClientRouteContext) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/clients/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel excluir o cliente." },
      { status: response.status },
    )
  }

  return new NextResponse(null, { status: 204 })
}
