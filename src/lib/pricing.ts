export type SaleFields = {
  saleEnabled?: boolean | null
  saleStart?: string | null
  saleEnd?: string | null
}

type Priceable = object

const isDateValid = (value: string | null | undefined) => {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

export const isSaleActive = (doc: SaleFields, now = new Date()): boolean => {
  if (!doc?.saleEnabled) return false

  const startOk = !isDateValid(doc.saleStart) || new Date(doc.saleStart as string) <= now
  const endOk = !isDateValid(doc.saleEnd) || new Date(doc.saleEnd as string) >= now

  return startOk && endOk
}

export const getEffectivePrice = (
  doc: Priceable & SaleFields,
  currencyCode: string,
  now = new Date(),
): { price: number | null; compareAt: number | null; onSale: boolean } => {
  const priceField = `priceIn${currencyCode}`
  const salePriceField = `salePriceIn${currencyCode}`

  const record = doc as Record<string, unknown>
  const basePrice = typeof record?.[priceField] === 'number' ? (record[priceField] as number) : null
  const salePrice =
    typeof record?.[salePriceField] === 'number' ? (record[salePriceField] as number) : null    

  const onSale = Boolean(
    basePrice !== null &&
    salePrice !== null &&
    salePrice > 0 &&
    salePrice < basePrice &&
    isSaleActive(doc, now),
  )

  return {
    price: onSale ? salePrice : basePrice,
    compareAt: onSale ? basePrice : null,
    onSale,
  }
}
