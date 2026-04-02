import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { publicAccess } from '@/access/publicAccess'
import { confirmRafflePaymentEndpoint } from '@/endpoints/raffles/confirmPayment'
import { initiateRafflePaymentEndpoint } from '@/endpoints/raffles/initiatePayment'
import { currenciesConfig } from '@/lib/constants'
import { buildRaffleDrawEndpoint } from '@/lib/raffles'
import { amountField } from '@payloadcms/plugin-ecommerce'
import { slugField } from 'payload'
import { submitRaffleBonusActionEndpoint } from '@/endpoints/raffles/submitBonusAction'
import { runDueRafflesEndpoint, runDueRafflesGetEndpoint } from '@/endpoints/raffles/runDueDraws'

export const Raffles: CollectionConfig = {
  slug: 'raffles',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicAccess,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'status', 'ticketPrice', 'maxTickets', 'drawDate'],
    group: 'Ecommerce',
    useAsTitle: 'title',
  },
  endpoints: [
    buildRaffleDrawEndpoint(),
    initiateRafflePaymentEndpoint,
    confirmRafflePaymentEndpoint,
    submitRaffleBonusActionEndpoint,
    runDueRafflesEndpoint,
    runDueRafflesGetEndpoint,
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({ fieldToUse: 'title' }),
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Open', value: 'open' },
        { label: 'Drawn', value: 'drawn' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'ticketPrice',
        label: 'Ticket Price',
        defaultValue: 0,
      },
    }),
    {
      name: 'drawDate',
      type: 'date',
      required: true,
    },
    {
      name: 'prizeType',
      type: 'select',
      defaultValue: 'discount',
      options: [
        { label: 'Free Watch', value: 'free' },
        { label: '50% Discount', value: 'discount' },
      ],
      required: true,
    },
    {
      name: 'maxTickets',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'eligibleProducts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'rewardCodeExpiresAt',
      type: 'date',
      admin: {
        description: 'Optional expiry date for winner discount codes.',
      },
    },
    {
      name: 'drawnAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'winnerEntry',
      type: 'relationship',
      relationTo: 'raffle-entries',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'entries',
      type: 'join',
      collection: 'raffle-entries',
      on: 'raffle',
      admin: {
        allowCreate: false,
        defaultColumns: ['ticketNumber', 'customerEmail', 'status', 'rewardType'],
      },
    },
    {
      name: 'purchases',
      type: 'join',
      collection: 'raffle-purchases',
      on: 'raffle',
      admin: {
        allowCreate: false,
        defaultColumns: ['customerEmail', 'quantity', 'amount', 'status', 'createdAt'],
      },
    },
  ],
}
