import type { Block } from 'payload'

import { link } from '@/fields/link'

export const SplitTiles: Block = {
  slug: 'splitTiles',
  interfaceName: 'SplitTilesBlock',
  labels: { singular: 'Split tiles', plural: 'Split tiles' },
  fields: [
    {
      name: 'tiles',
      type: 'array',
      minRows: 2,
      maxRows: 3,
      required: true,
      admin: { description: 'Large full-bleed image tiles shown side by side. Portrait images work best.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'eyebrow', type: 'text' },
        { name: 'title', type: 'text', required: true },
        link({ appearances: false }),
      ],
    },
  ],
}
