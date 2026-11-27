import { slugField, type CollectionConfig } from 'payload'

export const WatchCollections: CollectionConfig = {
  slug: 'watchCollections',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'brand'] },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'brand', type: 'relationship', relationTo: 'categories', required: true, index: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    slugField(),
  ],
}
