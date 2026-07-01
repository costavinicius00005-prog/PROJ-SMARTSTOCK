import type { CatalogOption } from "@/src/domain/catalog/catalog-option"

type CatalogResource = "categories" | "brands" | "units-of-measure"

const resourcePath: Record<CatalogResource, string> = {
  categories: "/api/categories",
  brands: "/api/brands",
  "units-of-measure": "/api/units-of-measure",
}

export async function listCatalogOptions(resource: CatalogResource) {
  const response = await fetch(resourcePath[resource], { cache: "no-store" })

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as opcoes.")
  }

  return (await response.json()) as CatalogOption[]
}

export async function createCatalogOption(resource: CatalogResource, value: string) {
  const cleanValue = value.trim()
  const body =
    resource === "units-of-measure"
      ? { acronym: cleanValue.toUpperCase(), name: cleanValue.toUpperCase() }
      : { name: cleanValue }

  const response = await fetch(resourcePath[resource], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error("Nao foi possivel criar a opcao.")
  }

  return (await response.json()) as CatalogOption
}
