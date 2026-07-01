export interface CatalogOption {
  id: string
  label: string
  value: string
  name: string
  acronym?: string | null
  active: boolean
  systemDefault: boolean
}
