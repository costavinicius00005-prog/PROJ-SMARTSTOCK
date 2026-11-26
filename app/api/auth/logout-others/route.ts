import { proxyToBackend } from "@/lib/server-auth"

export async function POST(request: Request) {
  return proxyToBackend(request, "/api/auth/logout-others", { method: "POST" })
}
