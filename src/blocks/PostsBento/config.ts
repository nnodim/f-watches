import type { Block } from 'payload'

export const PostsBento: Block = {
  slug: 'postsBento',
  interfaceName: 'PostsBentoBlock',
  labels: { singular: 'Posts Bento', plural: 'Posts Bento Grids' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Latest Articles' },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Latest posts', value: 'collection' },
        { label: 'Pick posts', value: 'selection' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { condition: (_, s) => s?.populateBy === 'collection' },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 8,
      min: 3,
      max: 8,
      admin: {
        description: 'The layout has 8 slots. Use 8 for a full grid.',
        condition: (_, s) => s?.populateBy === 'collection',
      },
    },
    {
      name: 'selectedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxRows: 8,
      admin: { condition: (_, s) => s?.populateBy === 'selection' },
    },
  ],
}
