import { slugField, type CollectionConfig } from 'payload'

export const WatchModels: CollectionConfig = {
  slug: 'watchModels',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'watchCollection'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true }, // "GA-2100"
    {
      name: 'watchCollection',
      type: 'relationship',
      relationTo: 'watchCollections',
      required: true,
      index: true,
    },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    slugField(),
  ],
}
