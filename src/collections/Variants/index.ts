import { amountField } from '@payloadcms/plugin-ecommerce'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { currenciesConfig } from '@/lib/constants'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => {
  const nextFields = [...(defaultCollection.fields || [])]

  nextFields.push(
    {
      name: 'saleEnabled',
      type: 'checkbox',
      label: 'Enable sale pricing',
      defaultValue: false,
    },
    {
      name: 'saleStart',
      type: 'date',
      admin: {
        condition: (data) => Boolean(data?.saleEnabled),
      },
    },
    {
      name: 'saleEnd',
      type: 'date',
      admin: {
        condition: (data) => Boolean(data?.saleEnabled),
      },
    },
    ...currenciesConfig.supportedCurrencies.map((currency) =>
      amountField({
        currenciesConfig,
        currency,
        overrides: {
          name: `salePriceIn${currency.code}`,
          label: `Sale Price (${currency.code})`,
          admin: {
            condition: (data) => Boolean(data?.saleEnabled),
          },
        },
      }),
    ),
  )

  return {
    ...defaultCollection,
    fields: nextFields,
  }
}
