import { adminOnly } from '@/access/adminOnly'
import type { CollectionConfig } from 'payload'

export const Expenses: CollectionConfig = {
  slug: 'expenses',
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'amount', 'category', 'date'],
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Enter amount in major currency unit (e.g. Naira, not Kobo)',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Marketing', value: 'marketing' },
        { label: 'Operations', value: 'operations' },
        { label: 'Software/SaaS', value: 'software' },
        { label: 'Salary', value: 'salary' },
        { label: 'Logistics', value: 'logistics' },
        { label: 'Office', value: 'office' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
}
