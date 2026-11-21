import type { Block } from 'payload'

export const Marquee: Block = {
  slug: 'marquee',
  interfaceName: 'MarqueeBlock',
  labels: { singular: 'Marquee', plural: 'Marquees' },
  fields: [
    {
      name: 'words',
      type: 'array',
      minRows: 2,
      maxRows: 10,
      required: true,
      admin: { description: 'Large scrolling words, e.g. Authentic, G-Shock, Tissot.' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'duration',
      type: 'number',
      defaultValue: 40,
      min: 10,
      max: 120,
      admin: { description: 'Seconds for one full loop. Higher = slower.' },
    },
  ],
}
