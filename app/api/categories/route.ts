import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = () => proxyCatalogResource("categories")
export const POST = (request: Request) => proxyCatalogResource("categories", request)
