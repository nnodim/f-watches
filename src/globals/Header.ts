import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: () => true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidateTag('global_header')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'announcement',
      type: 'text',
      admin: {
        description:
          'Optional slim bar above the header (e.g. a delivery or warranty note). Leave empty to hide it.',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      maxRows: 8,
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'link',
          required: true,
          options: [
            { label: 'Simple link', value: 'link' },
            { label: 'Mega menu', value: 'megaMenu' },
          ],
        },

        // ---- simple link ----
        link({
          appearances: false,
          overrides: {
            admin: { condition: (_: any, s: any) => s?.type !== 'megaMenu' },
          },
        }),

        // ---- mega menu ----
        {
          name: 'label',
          type: 'text',
          admin: { condition: (_, s) => s?.type === 'megaMenu' },
          validate: (val: unknown, { siblingData }: any) =>
            siblingData?.type === 'megaMenu' && !val ? 'A label is required' : true,
        },
        {
          name: 'source',
          type: 'select',
          defaultValue: 'custom',
          options: [
            { label: 'All brands (automatic)', value: 'allBrands' },
            { label: 'Custom columns', value: 'custom' },
          ],
          admin: {
            condition: (_, s) => s?.type === 'megaMenu',
            description:
              '"All brands" lists every brand from the Brands collection, A to Z. Hide a brand with its "Show in menu" checkbox.',
          },
        },
        {
          name: 'columns',
          type: 'array',
          maxRows: 4,
          admin: {
            condition: (_, s) => s?.type === 'megaMenu' && s?.source === 'custom',
          },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'links',
              type: 'array',
              maxRows: 12,
              fields: [link({ appearances: false })],
            },
          ],
        },
        {
          name: 'featured',
          type: 'group',
          label: 'Featured promo (optional, shown on the right)',
          admin: { condition: (_, s) => s?.type === 'megaMenu' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media' },
            { name: 'title', type: 'text' },
            { name: 'linkLabel', type: 'text' },
            { name: 'linkUrl', type: 'text' },
          ],
        },
      ],
    },
  ],
}
