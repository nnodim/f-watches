import type { Cart, Product, Variant } from '@/payload-types'

import {
  calculateDiscountAmount,
  distributeDiscountAcrossItems,
  type DiscountCodeDoc,
} from '@/lib/discounts'
import { getEffectivePrice } from '@/lib/pricing'

export type SnapshotItem = {
  product: string | null
  variant?: string | null
  quantity: number
  unitOriginalPrice?: number
  unitDiscount?: number
  unitPrice?: number
  unitCostPrice?: number
}

type CartItemSource = {
  product?: (string | null) | Product
  variant?: (string | null) | Variant
  quantity: number
}

const getProductId = (product?: (string | null) | Product) => {
  if (!product) return null
  return typeof product === 'object' ? product.id : product
}

const getVariantId = (variant?: (string | null) | Variant) => {
  if (!variant) return null
  return typeof variant === 'object' ? variant.id : variant
}

const getProductCostPrice = (product: Product | null, currency: string) => {
  if (!product) return 0
  const key = `costPriceIn${currency}` as keyof Product
  const value = product[key]
  return typeof value === 'number' ? value : 0
}

export const buildCartSnapshot = (args: {
  cart: Cart
  currency: string
  discountCode?: DiscountCodeDoc | null
}) => {
  const { cart, currency, discountCode } = args
  const items = (cart.items || []) as CartItemSource[]

  const pricedItems = items.map((item) => {
    const product = typeof item.product === 'object' ? item.product : null
    const variant = typeof item.variant === 'object' ? item.variant : null

    const priceSource = variant || product

    const effective = priceSource ? getEffectivePrice(priceSource as any, currency) : null

    const unitPrice = effective?.price ?? 0
    const unitOriginalPrice = effective?.compareAt ?? unitPrice
    const unitCostPrice = getProductCostPrice(product, currency)

    return {
      productID: getProductId(item.product) || 'unknown',
      quantity: item.quantity || 0,
      unitPrice,
      unitOriginalPrice,
      unitCostPrice,
      subtotal: unitPrice * (item.quantity || 0),
    }
  })

  const subtotal = pricedItems.reduce((sum, item) => sum + item.subtotal, 0)

  let discountAmount = 0
  let discountCursor = 0
  let eligibleItemsForDistribution = [] as typeof pricedItems

  if (discountCode) {
    const discountResult = calculateDiscountAmount(pricedItems, discountCode, currency)

    discountAmount = discountResult.amount

    if (discountAmount > 0) {
      if (discountCode.appliesTo === 'products') {
        const eligibleProductIDs = new Set(
          (discountCode.products || []).map((product) =>
            typeof product === 'string' ? product : product.id,
          ),
        )
        eligibleItemsForDistribution = pricedItems.filter((item) =>
          eligibleProductIDs.has(item.productID),
        )
      } else {
        eligibleItemsForDistribution = pricedItems
      }
    }
  }

  const perItemDiscounts = distributeDiscountAcrossItems(
    eligibleItemsForDistribution,
    discountAmount,
  )

  const snapshotItems: SnapshotItem[] = items.map((item, index) => {
    const base = pricedItems[index]
    let itemDiscountTotal = 0

    if (eligibleItemsForDistribution.length > 0) {
      const eligibleItem = eligibleItemsForDistribution[discountCursor]
      if (eligibleItem && eligibleItem.productID === base.productID) {
        itemDiscountTotal = perItemDiscounts[discountCursor] || 0
        discountCursor += 1
      }
    }

    const unitDiscount = base.quantity
      ? Math.round(itemDiscountTotal / Math.max(base.quantity, 1))
      : 0

    const finalUnitPrice = Math.max(base.unitPrice - unitDiscount, 0)

    return {
      product: getProductId(item.product),
      variant: getVariantId(item.variant) || undefined,
      quantity: item.quantity || 0,
      unitOriginalPrice: base.unitOriginalPrice,
      unitDiscount,
      unitPrice: finalUnitPrice,
      unitCostPrice: base.unitCostPrice,
    }
  })

  const total = Math.max(subtotal - discountAmount, 0)

  return {
    items: snapshotItems,
    subtotal,
    discountAmount,
    total,
  }
}
