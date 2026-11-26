import { proxyToBackend } from "@/lib/server-auth"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  return proxyToBackend(request, `/api/clients/${encodeURIComponent(id)}/anonymize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  })
}
