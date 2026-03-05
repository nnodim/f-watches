import { adminOnly } from '@/access/adminOnly'
import { currenciesConfig } from '@/lib/constants'
import { syncOrderDebtSummary } from '@/lib/debt'
import { amountField } from '@payloadcms/plugin-ecommerce'
import type { CollectionConfig } from 'payload'

export const DebtPayments: CollectionConfig = {
  slug: 'debt-payments',
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'order', 'amount', 'currency', 'paidAt', 'paymentMethod'],
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const orderID =
          typeof data?.order === 'object' && data.order
            ? data.order.id
            : typeof data?.order === 'string'
              ? data.order
              : null

        if (!orderID) return data

        const order = await req.payload.findByID({
          collection: 'orders',
          id: orderID,
          depth: 0,
          req,
          select: {
            customer: true,
            currency: true,
            customerEmail: true,
            debtTrackingEnabled: true,
          },
        })

        if (!order.debtTrackingEnabled) {
          throw new Error('Enable debt tracking on the order before recording debt payments.')
        }

        return {
          ...data,
          currency: order.currency,
          customer:
            order.customer && typeof order.customer === 'object' ? order.customer.id : order.customer,
          customerEmail: order.customerEmail,
          recordedBy: req.user?.id,
        }
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        const orderID = typeof doc.order === 'object' ? doc.order.id : doc.order

        if (typeof orderID === 'string') {
          await syncOrderDebtSummary({ orderID, req })
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const orderID = typeof doc.order === 'object' ? doc.order.id : doc.order

        if (typeof orderID === 'string') {
          await syncOrderDebtSummary({ orderID, req })
        }
      },
    ],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      unique: true,
      defaultValue: () => `debt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      required: true,
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'amount',
        label: 'Amount Paid',
        required: true,
        min: 0,
      },
    }),
    {
      name: 'currency',
      type: 'select',
      options: currenciesConfig.supportedCurrencies.map((currency) => ({
        label: currency.code,
        value: currency.code,
      })),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      defaultValue: 'bank-transfer',
      options: [
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'POS', value: 'pos' },
        { label: 'Mobile Transfer', value: 'mobile-transfer' },
        { label: 'Adjustment', value: 'adjustment' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'recordedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
