import type { Product } from '@/payload-types'

export type DiscountCodeType = 'percentage' | 'fixed' | 'free_shipping'
export type DiscountAppliesTo = 'order' | 'products'

export type DiscountCodeDoc = {
  id: string
  active?: boolean | null
  type?: DiscountCodeType | null
  appliesTo?: DiscountAppliesTo | null
  percentage?: number | null
  products?: (string | Product)[] | null
  startsAt?: string | null
  endsAt?: string | null
  maxUses?: number | null
  uses?: number | null
  [key: string]: unknown
}

export type PricedItem = {
  productID: string
  quantity: number
  unitPrice: number
  subtotal: number
}

type DiscountValidation = {
  valid: boolean
  reason?: string
}

const isDateValid = (value: string | null | undefined) => {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

const isWithinWindow = (code: DiscountCodeDoc, now: Date) => {
  const startOk = !isDateValid(code.startsAt) || new Date(code.startsAt as string) <= now
  const endOk = !isDateValid(code.endsAt) || new Date(code.endsAt as string) >= now
  return startOk && endOk
}

const getFixedAmount = (code: DiscountCodeDoc, currencyCode: string): number | null => {
  const key = `amountIn${currencyCode}`
  const value = code?.[key]
  return typeof value === 'number' ? value : null
}

const getMinSubtotal = (code: DiscountCodeDoc, currencyCode: string): number | null => {
  const key = `minSubtotalIn${currencyCode}`
  const value = code?.[key]
  return typeof value === 'number' ? value : null
}

export const normalizeCode = (code: string) => code.trim().toUpperCase()

export const validateDiscountCode = (
  code: DiscountCodeDoc,
  currencyCode: string,
  subtotal: number,
  now = new Date(),
): DiscountValidation => {
  if (!code.active) return { valid: false, reason: 'Code is not active.' }
  if (!isWithinWindow(code, now)) return { valid: false, reason: 'Code is not currently valid.' }

  if (typeof code.maxUses === 'number' && typeof code.uses === 'number') {
    if (code.uses >= code.maxUses) {
      return { valid: false, reason: 'Code usage limit reached.' }
    }
  }

  const minSubtotal = getMinSubtotal(code, currencyCode)
  if (typeof minSubtotal === 'number' && subtotal < minSubtotal) {
    return { valid: false, reason: 'Cart does not meet the minimum subtotal for this code.' }
  }

  if (code.type === 'percentage') {
    if (typeof code.percentage !== 'number' || code.percentage <= 0) {
      return { valid: false, reason: 'Percentage discount is not configured.' }
    }
  }

  if (code.type === 'fixed') {
    const amount = getFixedAmount(code, currencyCode)
    if (!amount || amount <= 0) {
      return { valid: false, reason: 'Fixed discount amount is not configured.' }
    }
  }

  return { valid: true }
}

export const getEligibleItems = (items: PricedItem[], code: DiscountCodeDoc): PricedItem[] => {
  if (code.appliesTo !== 'products') return items

  const eligibleProductIDs = new Set(
    (code.products || []).map((product) => (typeof product === 'string' ? product : product.id)),
  )

  return items.filter((item) => eligibleProductIDs.has(item.productID))
}

export const calculateDiscountAmount = (
  items: PricedItem[],
  code: DiscountCodeDoc,
  currencyCode: string,
): { amount: number; reason?: string; eligibleItems: PricedItem[] } => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const validation = validateDiscountCode(code, currencyCode, subtotal)
  if (!validation.valid) {
    return { amount: 0, reason: validation.reason, eligibleItems: [] }
  }

  const eligibleItems = getEligibleItems(items, code)
  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.subtotal, 0)

  if (code.appliesTo === 'products' && eligibleSubtotal <= 0) {
    return { amount: 0, reason: 'Code does not apply to items in your cart.', eligibleItems: [] }
  }

  if (code.type === 'free_shipping') {
    return { amount: 0, reason: 'Free shipping applied.', eligibleItems }
  }

  let discountAmount = 0

  if (code.type === 'percentage') {
    discountAmount = Math.round((eligibleSubtotal * (code.percentage as number)) / 100)
  }

  if (code.type === 'fixed') {
    const fixedAmount = getFixedAmount(code, currencyCode) || 0
    discountAmount = fixedAmount
  }

  if (discountAmount < 0) discountAmount = 0
  if (discountAmount > eligibleSubtotal) discountAmount = eligibleSubtotal

  return { amount: discountAmount, eligibleItems }
}

export const distributeDiscountAcrossItems = (
  eligibleItems: PricedItem[],
  discountAmount: number,
): number[] => {
  if (eligibleItems.length === 0 || discountAmount <= 0) return []

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.subtotal, 0)
  if (eligibleSubtotal <= 0) return eligibleItems.map(() => 0)

  const perItemDiscounts: number[] = []
  let remaining = discountAmount

  eligibleItems.forEach((item, index) => {
    if (index === eligibleItems.length - 1) {
      perItemDiscounts.push(remaining)
      return
    }

    const share = Math.round((item.subtotal / eligibleSubtotal) * discountAmount)
    const applied = Math.min(share, remaining)
    perItemDiscounts.push(applied)
    remaining -= applied
  })

  return perItemDiscounts
}
