import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = (request: Request) => proxyCatalogResource("units-of-measure", request)
export const POST = (request: Request) => proxyCatalogResource("units-of-measure", request, true)
