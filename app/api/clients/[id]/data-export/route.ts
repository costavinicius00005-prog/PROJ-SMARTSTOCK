import { proxyToBackend } from "@/lib/server-auth"

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(request, `/api/clients/${encodeURIComponent(id)}/data-export`)
}
