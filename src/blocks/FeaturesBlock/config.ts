import { Block } from 'payload'

export const Features: Block = {
  slug: 'features',
  labels: {
    singular: 'Features Section',
    plural: 'Features Sections',
  },
  interfaceName: 'FeaturesBlock',
  fields: [
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 1,
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          options: [
            { label: 'Settings', value: 'settings' },
            { label: 'Blocks', value: 'blocks' },
            { label: 'Bot', value: 'bot' },
            { label: 'Film', value: 'film' },
            { label: 'Chart Pie', value: 'chartPie' },
            { label: 'Message Circle', value: 'messageCircle' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: true,
        },
      ],
    },
  ],
}
