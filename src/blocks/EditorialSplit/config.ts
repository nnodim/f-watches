import type { Block } from 'payload'

import { link } from '@/fields/link'

export const EditorialSplit: Block = {
  slug: 'editorialSplit',
  interfaceName: 'EditorialSplitBlock',
  labels: { singular: 'Editorial split', plural: 'Editorial splits' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Image left', value: 'left' },
        { label: 'Image right', value: 'right' },
      ],
    },
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'enableLink', type: 'checkbox', label: 'Show a button' },
    link({
      appearances: false,
      overrides: {
        admin: { condition: (_, siblingData) => Boolean(siblingData?.enableLink) },
      },
    }),
  ],
}
