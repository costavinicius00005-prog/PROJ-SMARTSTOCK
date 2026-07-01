import { NextResponse } from "next/server"

const apiBaseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:8080"

type CatalogResource = "categories" | "brands" | "units-of-measure"

const backendPath: Record<CatalogResource, string> = {
  categories: "/api/categories",
  brands: "/api/brands",
  "units-of-measure": "/api/units-of-measure",
}

export async function proxyCatalogResource(resource: CatalogResource, request?: Request) {
  const response = await fetch(`${apiBaseUrl}${backendPath[resource]}`, {
    method: request ? "POST" : "GET",
    headers: request
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: request ? await request.text() : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: "Nao foi possivel processar a opcao de catalogo." },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json(), { status: request ? 201 : 200 })
}
