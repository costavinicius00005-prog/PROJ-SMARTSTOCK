import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/server-auth"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type CatalogResource = "categories" | "brands" | "units-of-measure"

const backendPath: Record<CatalogResource, string> = {
  categories: "/api/categories",
  brands: "/api/brands",
  "units-of-measure": "/api/units-of-measure",
}

export async function proxyCatalogResource(resource: CatalogResource, request: Request, create = false) {
  const response = await backendFetch(request, `${apiBaseUrl}${backendPath[resource]}`, {
    method: create ? "POST" : "GET",
    headers: create ? { "Content-Type": "application/json" } : undefined,
    body: create ? await request.text() : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel processar a opcao de catalogo." },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json(), { status: create ? 201 : 200 })
}
