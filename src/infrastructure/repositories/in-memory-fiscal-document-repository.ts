import type { FiscalDocumentRepository } from "@/src/application/ports/fiscal/fiscal-document-repository"
import { fiscalDocuments } from "@/src/infrastructure/mock-data/fiscal/documents"

export const inMemoryFiscalDocumentRepository: FiscalDocumentRepository = {
  list: () => fiscalDocuments,
}
