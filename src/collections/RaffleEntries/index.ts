import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrRaffleEntryOwner } from '@/access/adminOrRaffleEntryOwner'

export const RaffleEntries: CollectionConfig = {
  slug: 'raffle-entries',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrRaffleEntryOwner,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['ticketNumber', 'raffle', 'customerEmail', 'status', 'rewardType', 'createdAt'],
    group: 'Ecommerce',
    useAsTitle: 'ticketNumber',
  },
  fields: [
    {
      name: 'ticketNumber',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'raffle',
      type: 'relationship',
      relationTo: 'raffles',
      required: true,
    },
    {
      name: 'purchase',
      type: 'relationship',
      relationTo: 'raffle-purchases',
      required: true,
    },
    {
      name: 'entrySource',
      type: 'select',
      defaultValue: 'purchase',
      required: true,
      options: [
        { label: 'Purchase', value: 'purchase' },
        { label: 'Bonus', value: 'bonus' },
      ],
    },
    {
      name: 'bonusAction',
      type: 'relationship',
      relationTo: 'raffle-bonus-actions',
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
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Winner', value: 'winner' },
        { label: 'Not Selected', value: 'not-selected' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
    },
    {
      name: 'rewardType',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Free Watch', value: 'free-watch' },
        { label: '50% Off', value: 'half-off' },
      ],
      required: true,
    },
    {
      name: 'rewardCode',
      type: 'text',
    },
    {
      name: 'rewardDiscountCode',
      type: 'relationship',
      relationTo: 'discount-codes',
    },
    {
      name: 'drawnAt',
      type: 'date',
    },
  ],
  timestamps: true,
}
