import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'blurb',
      type: 'textarea',
      admin: { description: 'Short line shown under the logo in the footer.' },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
    {
      name: 'socials',
      type: 'array',
      maxRows: 8,
      admin: {
        description: 'Leave empty to keep the current Instagram / TikTok / Snapchat links.',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Snapchat', value: 'snapchat' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'X (Twitter)', value: 'x' },
            { label: 'WhatsApp', value: 'whatsapp' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
