import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = (request: Request) => proxyCatalogResource("brands", request)
export const POST = (request: Request) => proxyCatalogResource("brands", request, true)
