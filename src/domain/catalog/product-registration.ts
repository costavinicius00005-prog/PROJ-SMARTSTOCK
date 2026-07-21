export type ProductPricingFieldValue = number | ""

export interface ProductRegistration {
  name: string
  categoryId: string
  brandId: string
  internalCode: string
  variationType: string
  description: string
  unitOfMeasureId: string
  costValue: ProductPricingFieldValue
  saleMarkup: ProductPricingFieldValue
  salePrice: ProductPricingFieldValue
  barcode: string
}
