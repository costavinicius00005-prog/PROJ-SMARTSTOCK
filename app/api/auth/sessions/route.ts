import { proxyToBackend } from "@/lib/server-auth"

export async function GET(request: Request) {
  return proxyToBackend(request, "/api/auth/sessions")
}
