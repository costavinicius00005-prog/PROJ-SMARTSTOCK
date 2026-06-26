import type { FiscalDocumentRepository } from "@/src/application/ports/fiscal/fiscal-document-repository"

export function listFiscalDocuments(repository: FiscalDocumentRepository) {
  return repository.list()
}
