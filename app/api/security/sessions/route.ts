import { proxyToBackend } from "@/lib/server-auth"

export async function GET(request: Request) {
  const query = new URL(request.url).search
  return proxyToBackend(request, `/api/security/sessions${query}`)
}
