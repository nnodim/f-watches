import { currenciesConfig } from '@/lib/constants'
import { amountField } from '@payloadcms/plugin-ecommerce'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { fieldAffectsData } from 'payload/shared'

export const OrdersCollection: CollectionOverride = ({ defaultCollection }) => {
  const nextFields = (defaultCollection.fields || []).map((f) => {
    if (f.type !== 'tabs') return f

    return {
      ...f,
      tabs: f.tabs?.map((tab) => {
        return {
          ...tab,
          fields: (tab.fields || []).map((tabField) => {
            if (
              fieldAffectsData(tabField) &&
              tabField.name === 'items' &&
              tabField.type === 'array'
            ) {
              return {
                ...tabField,
                fields: [
                  ...(tabField.fields || []),
                  amountField({
                    currenciesConfig,
                    overrides: {
                      name: 'unitPrice',
                      label: `Unit Price`,
                      defaultValue: 0,
                    },
                  }),
                  amountField({
                    currenciesConfig,
                    overrides: {
                      name: 'unitCostPrice',
                      label: `Unit Cost Price`,
                      defaultValue: 0,
                    },
                  }),
                ],
              }
            }
            return tabField
          }),
        }
      }),
    }
  })

  return {
    ...defaultCollection,
    fields: nextFields,
  }
}
