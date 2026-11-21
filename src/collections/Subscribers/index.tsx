import type { Access, CollectionConfig } from 'payload'

/**
 * Only admins can see or change the list. Public sign-ups never touch this
 * access layer: the /api/newsletter route writes with the local API.
 *
 * If your Users collection has a `roles` array (ecommerce template), only
 * users with the 'admin' role pass. If it has no roles, any logged-in user does.
 */
const adminOnly: Access = ({ req: { user } }) => {
  if (!user) return false
  const roles = (user as { roles?: unknown }).roles
  return Array.isArray(roles) ? roles.includes('admin') : true
}

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Subscriber', plural: 'Subscribers' },
  access: {
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'source', 'createdAt'],
    group: 'Marketing',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      hooks: {
        // Keeps "Ada@Mail.com " and "ada@mail.com" from becoming two subscribers.
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'subscribed',
      index: true,
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Set to Unsubscribed to honour an opt-out. Unsubscribed addresses are never re-subscribed by the website form.',
      },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'website',
      admin: { position: 'sidebar', description: 'Where the sign-up came from.' },
    },
  ],
}
