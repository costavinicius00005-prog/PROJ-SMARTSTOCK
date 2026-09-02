import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const response = await fetch(`${apiBaseUrl}/api/suppliers/${id}`, { method: "DELETE" })
  if (!response.ok) {
    return NextResponse.json({ message: "Nao foi possivel excluir o fornecedor." }, { status: response.status })
  }
  return new NextResponse(null, { status: 204 })
}
