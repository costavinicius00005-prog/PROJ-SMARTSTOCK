import { proxyToBackend } from "@/lib/server-auth"

export async function POST(request: Request) {
  return proxyToBackend(request, "/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  })
}
