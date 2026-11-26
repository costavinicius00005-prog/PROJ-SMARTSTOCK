import { proxyToBackend } from "@/lib/server-auth"

type Context = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(request, `/api/auth/sessions/${encodeURIComponent(id)}`, { method: "DELETE" })
}
