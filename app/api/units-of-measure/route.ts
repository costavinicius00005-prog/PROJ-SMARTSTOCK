import { proxyCatalogResource } from "@/src/infrastructure/http/proxy-catalog-resource"

export const GET = () => proxyCatalogResource("units-of-measure")
export const POST = (request: Request) => proxyCatalogResource("units-of-measure", request)
