import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.text()

  const response = await fetch(`${apiBaseUrl}/api/deliveries/${id}/assignee`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  })
}
