import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = (request: Request) => proxyCatalogResource("categories", request)
export const POST = (request: Request) => proxyCatalogResource("categories", request, true)
