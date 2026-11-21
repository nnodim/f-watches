import type { Block } from 'payload'

import { link } from '@/fields/link'

export const BrandGrid: Block = {
  slug: 'brandGrid',
  interfaceName: 'BrandGridBlock',
  labels: { singular: 'Brand grid', plural: 'Brand grids' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Shop by brand' },
    {
      name: 'brands',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      required: true,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        link({ appearances: false }),
      ],
    },
  ],
}
