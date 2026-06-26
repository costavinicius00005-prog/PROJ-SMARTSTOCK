import type { FiscalDocument } from "@/src/domain/fiscal/fiscal-document"

export interface FiscalDocumentRepository {
  list(): FiscalDocument[]
}
