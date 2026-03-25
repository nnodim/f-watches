import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrRafflePurchaseOwner } from '@/access/adminOrRafflePurchaseOwner'

export const RafflePurchases: CollectionConfig = {
  slug: 'raffle-purchases',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrRafflePurchaseOwner,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['raffle', 'customerEmail', 'quantity', 'amount', 'status', 'createdAt'],
    group: 'Ecommerce',
    useAsTitle: 'paymentReference',
  },
  fields: [
    {
      name: 'raffle',
      type: 'relationship',
      relationTo: 'raffles',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'NGN',
      required: true,
    },
    {
      name: 'paymentReference',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
    },
    {
      name: 'paidAt',
      type: 'date',
    },
    {
      name: 'entriesCreatedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'bonusActions',
      type: 'join',
      collection: 'raffle-bonus-actions',
      on: 'purchase',
      admin: {
        allowCreate: false,
        defaultColumns: ['actionType', 'platform', 'status', 'bonusEntryCount', 'createdAt'],
      },
    },
  ],
  timestamps: true,
}
