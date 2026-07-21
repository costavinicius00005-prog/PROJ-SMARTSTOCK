const currencyPrecision = 2
const markupPrecision = 4

export function calculateSalePrice(costValue: number, saleMarkup: number) {
  if (costValue <= 0 || saleMarkup < 0) {
    return 0
  }

  return roundToPrecision(costValue * (1 + saleMarkup / 100), currencyPrecision)
}

export function calculateSaleMarkup(costValue: number, salePrice: number) {
  if (costValue <= 0 || salePrice <= 0) {
    return 0
  }

  return roundToPrecision(((salePrice - costValue) / costValue) * 100, markupPrecision)
}

export function roundToPrecision(value: number, precision: number) {
  const multiplier = 10 ** precision

  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}
