import type { CollectionBeforeChangeHook } from 'payload'

import { getEffectivePrice } from '@/lib/pricing'
import { calculateDiscountAmount, type DiscountCodeDoc, type PricedItem } from '@/lib/discounts'
import { currenciesConfig } from '@/lib/constants'
import type { Cart, DiscountCode } from '@/payload-types'

type CartData = Partial<Cart> & {
  discountCode?: string | DiscountCodeDoc | null
  discountReason?: string | null
  total?: number | null
  discountAmountInNGN?: number | null
  discountAmountInUSD?: number | null
}

const getCurrency = (data: CartData, originalDoc?: Cart | null) => {
  return (data.currency || originalDoc?.currency || currenciesConfig.defaultCurrency) as string
}

const resolveDiscountCodeDoc = async (
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  value: string | DiscountCodeDoc | DiscountCode | null | undefined,
): Promise<DiscountCodeDoc | null> => {
  if (!value) return null
  if (typeof value === 'object') return value as unknown as DiscountCodeDoc

  try {
    const doc = await req.payload.findByID({
      collection: 'discount-codes',
      id: value,
      depth: 0,
      select: {
        id: true,
        active: true,
        type: true,
        appliesTo: true,
        percentage: true,
        products: true,
        startsAt: true,
        endsAt: true,
        maxUses: true,
        uses: true,
        amountInNGN: true,
        amountInUSD: true,
        minSubtotalInNGN: true,
        minSubtotalInUSD: true,
      },
    })

    return doc as unknown as DiscountCodeDoc
  } catch {
    return null
  }
}

export const syncCartPricing: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const cartData = data as CartData
  const currency = getCurrency(cartData, originalDoc as Cart | null)
  const items = cartData.items ?? originalDoc?.items ?? []

  if (!items || !Array.isArray(items) || items.length === 0) {
    cartData.subtotal = 0
    cartData.total = 0
    cartData.discountReason = undefined
    cartData.discountAmountInNGN = 0
    cartData.discountAmountInUSD = 0
    return data
  }

  const pricedItems: PricedItem[] = []
  let subtotal = 0

  for (const item of items) {
    const quantity = item.quantity || 0
    if (!quantity) continue

    let productID: string | null = null
    let unitPrice = 0

    if (item.variant) {
      const variantID = typeof item.variant === 'object' ? item.variant.id : item.variant
      const variant = await req.payload.findByID({
        id: variantID,
        collection: 'variants',
        depth: 0,
        overrideAccess: false,
        user: req.user,
        select: {
          id: true,
          saleEnabled: true,
          saleStart: true,
          saleEnd: true,
          priceInNGN: true,
          priceInUSD: true,
          salePriceInNGN: true,
          salePriceInUSD: true,
        },
      })

      const productFromItem = typeof item.product === 'object' ? item.product?.id : item.product
      const fallbackProductID =
        typeof variant?.product === 'object' ? variant?.product?.id : variant?.product

      const productIDToFetch = productFromItem || fallbackProductID

      const parentProduct = productIDToFetch
        ? await req.payload.findByID({
            id: productIDToFetch,
            collection: 'products',
            depth: 0,
            overrideAccess: false,
            user: req.user,
        select: {},
      })
        : null

      productID = parentProduct?.id || null
      const effective = getEffectivePrice(variant as any, currency)
      unitPrice = effective.price || 0
    } else if (item.product) {
      const productIDValue = typeof item.product === 'object' ? item.product.id : item.product
      const product = await req.payload.findByID({
        id: productIDValue,
        collection: 'products',
        depth: 0,
        overrideAccess: false,
        user: req.user,
        select: {
          id: true,
          saleEnabled: true,
          saleStart: true,
          saleEnd: true,
          priceInNGN: true,
          priceInUSD: true,
          salePriceInNGN: true,
          salePriceInUSD: true,
        },
      })

      productID = product?.id || null
      const effective = getEffectivePrice(product as any, currency)
      unitPrice = effective.price || 0
    }

    const itemSubtotal = unitPrice * quantity
    subtotal += itemSubtotal

    pricedItems.push({
      productID: productID || 'unknown',
      quantity,
      unitPrice,
      subtotal: itemSubtotal,
    })
  }

  const discountCodeDoc = await resolveDiscountCodeDoc(
    req,
    cartData.discountCode ?? originalDoc?.discountCode,
  )

  let discountAmount = 0
  let discountReason: string | undefined

  if (discountCodeDoc) {
    const discountResult = calculateDiscountAmount(pricedItems, discountCodeDoc, currency)
    discountAmount = discountResult.amount
    discountReason = discountResult.reason

    if (discountAmount <= 0 && discountReason) {
      cartData.discountCode = null
    }
  }

  const total = Math.max(subtotal - discountAmount, 0)
  console.log(total, subtotal, discountAmount);
  

  cartData.subtotal = subtotal
  cartData.total = total
  cartData.discountReason = discountReason

  if (currency === 'NGN') {
    cartData.discountAmountInNGN = discountAmount
    cartData.discountAmountInUSD = 0
  }

  if (currency === 'USD') {
    cartData.discountAmountInUSD = discountAmount
    cartData.discountAmountInNGN = 0
  }

  return data
}
