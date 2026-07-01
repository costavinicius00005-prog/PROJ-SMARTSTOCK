import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = () => proxyCatalogResource("brands")
export const POST = (request: Request) => proxyCatalogResource("brands", request)
