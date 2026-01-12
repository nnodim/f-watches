import { authenticated } from '@/access/isAuthenticated'
import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

export const PostCategories: CollectionConfig = {
  slug: 'postCategories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
