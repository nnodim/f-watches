import type { Block } from 'payload'

export const Newsletter: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: { singular: 'Newsletter', plural: 'Newsletters' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Stay in time' },
    { name: 'description', type: 'text', defaultValue: 'New arrivals and restocks, sent to your inbox.' },
    { name: 'buttonLabel', type: 'text', defaultValue: 'Subscribe' },
    {
      name: 'endpoint',
      type: 'text',
      defaultValue: '/api/newsletter',
      admin: {
        description:
          'URL that receives a JSON POST { email }. You must provide this endpoint before using the block (see README).',
      },
    },
  ],
}
