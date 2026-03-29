import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { publicAccess } from '@/access/publicAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { checkRole } from '@/access/utilities'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { VerifyEmailEndpoint } from './endpoints/verifyEmail'
import { addVerificationToken } from './hooks/addVerificationToken'
import { sendVerificationEmail } from './hooks/sendVerificationEmail'
import { verificationBeforeLogin } from './hooks/verificationBeforeLogin'
import { ForgotPasswordEmailHtml } from '@/components/emails/ForgotPasswordEmail'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  hooks: {
    beforeChange: [addVerificationToken],
    afterChange: [sendVerificationEmail],
    beforeLogin: [verificationBeforeLogin],
  },
  endpoints: [VerifyEmailEndpoint],
  auth: {
    tokenExpiration: 86400,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        // Generate the email HTML
        if (!args) {
          throw new Error('Invalid arguments')
        }
        const html = await ForgotPasswordEmailHtml({
          token: args.token as string,
          userEmail: args.user.email,
        })
        return html
      },
      generateEmailSubject: () => {
        return 'Reset Your Password - Fwatches'
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: '_verified',
      type: 'checkbox',
      defaultValue: false,
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: '_verificationToken',
      type: 'text',
      hidden: true,
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
    {
      name: 'raffleEntries',
      type: 'join',
      collection: 'raffle-entries',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['ticketNumber', 'raffle', 'status', 'rewardType', 'createdAt'],
      },
    },
    {
      name: 'rafflePurchases',
      type: 'join',
      collection: 'raffle-purchases',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['raffle', 'quantity', 'amount', 'status', 'createdAt'],
      },
    },
    {
      name: 'raffleBonusActions',
      type: 'join',
      collection: 'raffle-bonus-actions',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['actionType', 'platform', 'status', 'bonusEntryCount', 'createdAt'],
      },
    },
  ],
}
