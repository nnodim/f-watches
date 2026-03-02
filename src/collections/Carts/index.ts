import type { Field } from 'payload'

import { amountField } from '@payloadcms/plugin-ecommerce'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { currenciesConfig } from '@/lib/constants'
import { syncCartPricing } from '@/hooks/syncCartPricing'

const discountAmountFields: Field[] = currenciesConfig.supportedCurrencies.map((currency) =>
  amountField({
    currenciesConfig,
    currency,
    overrides: {
      name: `discountAmountIn${currency.code}`,
      label: `Discount (${currency.code})`,
      admin: {
        readOnly: true,
      },
    },
  }),
)

export const CartsCollection: CollectionOverride = ({ defaultCollection }) => {
  const nextFields = [...(defaultCollection.fields || [])]

  nextFields.push(
    {
      name: 'discountCode',
      type: 'relationship',
      relationTo: 'discount-codes',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'discountReason',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    ...discountAmountFields,
    {
      name: 'total',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  )

  return {
    ...defaultCollection,
    fields: nextFields,
    defaultPopulate: {
      ...defaultCollection.defaultPopulate,
      discountCode: true,
    },
    hooks: {
      ...(defaultCollection.hooks || {}),
      beforeChange: [
        ...(defaultCollection.hooks?.beforeChange || []),
        syncCartPricing,
      ],
    },
  }
}
