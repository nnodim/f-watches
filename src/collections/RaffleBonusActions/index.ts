import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrRaffleBonusActionOwner } from '@/access/adminOrRaffleBonusActionOwner'

const awardBonusEntries: CollectionAfterChangeHook = async ({ doc, previousDoc, req, context }) => {
  if (context.bonusEntriesGranted) return doc
  if (doc.status !== 'approved' || doc.bonusEntriesGranted) return doc
  if (previousDoc?.status === 'approved' && previousDoc?.bonusEntriesGranted) return doc

  const raffleID = typeof doc.raffle === 'object' ? doc.raffle.id : doc.raffle
  const purchaseID = typeof doc.purchase === 'object' ? doc.purchase.id : doc.purchase
  const customerID =
    doc.customer && typeof doc.customer === 'object' ? doc.customer.id : doc.customer || undefined

  if (!raffleID || !purchaseID || !doc.customerEmail || !doc.bonusEntryCount) {
    return doc
  }

  for (let index = 0; index < doc.bonusEntryCount; index += 1) {
    await req.payload.create({
      collection: 'raffle-entries',
      data: {
        bonusAction: doc.id,
        customer: customerID,
        customerEmail: doc.customerEmail,
        entrySource: 'bonus',
        purchase: purchaseID,
        raffle: raffleID,
        rewardType: 'none',
        status: 'active',
        ticketNumber: `BON-${doc.id.slice(0, 6).toUpperCase()}-${Date.now()}-${index + 1}`,
      },
      req,
    })
  }

  await req.payload.update({
    collection: 'raffle-bonus-actions',
    id: doc.id,
    context: {
      bonusEntriesGranted: true,
    },
    data: {
      bonusEntriesGranted: true,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user?.id,
    },
    req,
  })

  return doc
}

export const RaffleBonusActions: CollectionConfig = {
  slug: 'raffle-bonus-actions',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrRaffleBonusActionOwner,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['actionType', 'customerEmail', 'status', 'bonusEntryCount', 'createdAt'],
    group: 'Ecommerce',
    useAsTitle: 'actionType',
  },
  hooks: {
    afterChange: [awardBonusEntries],
  },
  fields: [
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
      name: 'actionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Follow page', value: 'follow' },
        { label: 'Repost campaign ad', value: 'repost' },
        { label: 'Tag friends', value: 'tag-friends' },
      ],
    },
    {
      name: 'socialHandle',
      type: 'text',
      required: true,
    },
    {
      name: 'bonusEntryCount',
      type: 'number',
      min: 1,
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'bonusEntriesGranted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
