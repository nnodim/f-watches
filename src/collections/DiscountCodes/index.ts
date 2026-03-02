import type { CollectionConfig, Field } from 'payload'

import { amountField } from '@payloadcms/plugin-ecommerce'
import { adminOnly } from '@/access/adminOnly'
import { currenciesConfig } from '@/lib/constants'

const fixedAmountFields: Field[] = currenciesConfig.supportedCurrencies.map((currency) =>
  amountField({
    currenciesConfig,
    currency,
    overrides: {
      name: `amountIn${currency.code}`,
      label: `Amount (${currency.code})`,
      admin: {
        condition: ({ type }) => type === 'fixed',
      },
    },
  }),
)

const minSubtotalFields: Field[] = currenciesConfig.supportedCurrencies.map((currency) =>
  amountField({
    currenciesConfig,
    currency,
    overrides: {
      name: `minSubtotalIn${currency.code}`,
      label: `Min subtotal (${currency.code})`,
    },
  }),
)

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'code',
    defaultColumns: ['code', 'type', 'appliesTo', 'active', 'uses', 'maxUses'],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code && typeof data.code === 'string') {
          data.code = data.code.trim().toUpperCase()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed amount', value: 'fixed' },
        { label: 'Free shipping', value: 'free_shipping' },
      ],
    },
    {
      name: 'percentage',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        condition: ({ type }) => type === 'percentage',
      },
    },
    ...fixedAmountFields,
    {
      name: 'appliesTo',
      type: 'select',
      required: true,
      defaultValue: 'order',
      options: [
        { label: 'Order', value: 'order' },
        { label: 'Products', value: 'products' },
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: ({ appliesTo }) => appliesTo === 'products',
      },
    },
    {
      name: 'startsAt',
      type: 'date',
    },
    {
      name: 'endsAt',
      type: 'date',
    },
    ...minSubtotalFields,
    {
      name: 'maxUses',
      type: 'number',
      min: 1,
      admin: {
        description: 'Maximum number of times this code can be used.',
      },
    },
    {
      name: 'uses',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}
