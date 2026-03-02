import type { CollectionBeforeChangeHook } from 'payload'

import { isSaleActive } from '@/lib/pricing'

type DataWithSale = {
  saleEnabled?: boolean | null
  saleStart?: string | null
  saleEnd?: string | null
}

export const syncSaleFlags: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return data

  const saleData = data as DataWithSale & { isOnSale?: boolean }
  saleData.isOnSale = isSaleActive(saleData)

  return data
}
