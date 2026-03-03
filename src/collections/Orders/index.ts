import { currenciesConfig } from '@/lib/constants'
import { syncOrderDebtSummary } from '@/lib/debt'
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
                      name: 'unitOriginalPrice',
                      label: 'Unit Original Price',
                      defaultValue: 0,
                    },
                  }),
                  amountField({
                    currenciesConfig,
                    overrides: {
                      name: 'unitDiscount',
                      label: 'Unit Discount',
                      defaultValue: 0,
                    },
                  }),
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
    admin: {
      ...defaultCollection.admin,
      useAsTitle: 'id',
      defaultColumns: [
        'id',
        'customerEmail',
        'status',
        'amount',
        'currency',
        'debtStatus',
        'amountOutstanding',
        'createdAt',
      ],
    },
    hooks: {
      ...defaultCollection.hooks,
      afterChange: [
        ...(defaultCollection.hooks?.afterChange || []),
        async ({ doc, req, context }) => {
          if (context.skipDebtSync) return doc

          await syncOrderDebtSummary({
            orderID: doc.id,
            req,
          })

          return doc
        },
      ],
    },
    fields: [
      ...nextFields,
      {
        name: 'debtTrackingEnabled',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          position: 'sidebar',
          description: 'Enable this order for debt tracking and repayment management.',
        },
      },
      {
        name: 'debtStatus',
        type: 'select',
        defaultValue: 'not-tracked',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
        options: [
          { label: 'Not Tracked', value: 'not-tracked' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Partial', value: 'partial' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Overpaid', value: 'overpaid' },
        ],
      },
      amountField({
        currenciesConfig,
        overrides: {
          name: 'shippingFee',
          label: 'Shipping Fee',
          defaultValue: 0,
          admin: {
            position: 'sidebar',
          },
        },
      }),
      amountField({
        currenciesConfig,
        overrides: {
          name: 'amountPaid',
          label: 'Amount Paid',
          defaultValue: 0,
          admin: {
            position: 'sidebar',
            readOnly: true,
          },
        },
      }),
      amountField({
        currenciesConfig,
        overrides: {
          name: 'amountOutstanding',
          label: 'Amount Outstanding',
          defaultValue: 0,
          admin: {
            position: 'sidebar',
            readOnly: true,
          },
        },
      }),
      {
        name: 'debtDueDate',
        type: 'date',
        admin: {
          position: 'sidebar',
          date: {
            pickerAppearance: 'dayOnly',
          },
        },
      },
      {
        name: 'debtLastPaymentAt',
        type: 'date',
        admin: {
          position: 'sidebar',
          readOnly: true,
          date: {
            pickerAppearance: 'dayAndTime',
          },
        },
      },
      {
        name: 'debtNotes',
        type: 'textarea',
        admin: {
          description: 'Internal notes for collection and follow-up.',
        },
      },
      {
        name: 'debtPayments',
        type: 'join',
        collection: 'debt-payments',
        on: 'order',
        admin: {
          allowCreate: false,
          defaultColumns: ['reference', 'amount', 'currency', 'paidAt', 'paymentMethod'],
        },
      },
    ],
  }
}
