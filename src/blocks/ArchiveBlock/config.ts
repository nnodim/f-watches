import type { Block, Where } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { caseMaterialOptions, movementOptions } from '@/lib/constants'

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)
const idsOf = (v: any): (string | number)[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map(idOf).filter((x) => x != null)

const isCollectionMode = (_: unknown, s: any) => s?.populateBy === 'collection'
const isProductMode = (_: unknown, s: any) =>
  s?.populateBy === 'collection' && s?.relationTo === 'products'

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      label: 'Intro Content',
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Individual Selection', value: 'selection' },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      admin: { condition: (_, s) => s.populateBy === 'collection' },
      defaultValue: 'posts',
      label: 'Collections To Show',
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Products', value: 'products' },
      ],
    },
    {
      name: 'filterType',
      type: 'select',
      label: 'Filter Type',
      admin: { condition: (_, s) => s.populateBy === 'collection' },
      options: [
        { label: 'All', value: 'all' },
        { label: 'Featured', value: 'featured' },
        { label: 'On Sale', value: 'onSale' },
        { label: 'New Arrivals', value: 'new-arrival' },
      ],
      defaultValue: 'all',
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        condition: isCollectionMode,
        description: 'For products these are brands (e.g. Casio).',
      },
      hasMany: true,
      label: 'Brands / Categories To Show',
      relationTo: 'categories',
    },
    {
      name: 'watchCollections',
      type: 'relationship',
      relationTo: 'watchCollections',
      hasMany: true,
      label: 'Watch Collections (e.g. G-Shock)',
      admin: {
        condition: isProductMode,
        description: 'Narrower than brand. If set, brand is ignored.',
      },
      filterOptions: ({ siblingData }) => {
        const brands = idsOf((siblingData as any)?.categories)
        return brands.length ? ({ brand: { in: brands } } as Where) : true
      },
    },
    {
      name: 'watchModels',
      type: 'relationship',
      relationTo: 'watchModels',
      hasMany: true,
      label: 'Models (e.g. GA-2100)',
      admin: {
        condition: isProductMode,
        description: 'Narrowest. If set, brand and collection are ignored.',
      },
      filterOptions: ({ siblingData }) => {
        const s = siblingData as any
        const cols = idsOf(s?.watchCollections)
        if (cols.length) return { watchCollection: { in: cols } } as Where
        const brands = idsOf(s?.categories)
        if (brands.length) return { 'watchCollection.brand': { in: brands } } as Where
        return true
      },
    },
    {
      name: 'movement',
      type: 'select',
      hasMany: true,
      options: movementOptions,
      admin: { condition: isProductMode },
    },
    {
      name: 'caseMaterial',
      type: 'select',
      hasMany: true,
      options: caseMaterialOptions,
      admin: { condition: isProductMode },
    },

    {
      name: 'limit',
      type: 'number',
      admin: { condition: isCollectionMode, step: 1 },
      defaultValue: 10,
      label: 'Limit',
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: { condition: (_, s) => s.populateBy === 'selection' },
      hasMany: true,
      label: 'Selection',
      relationTo: ['products'],
    },
  ],
  labels: { plural: 'Archives', singular: 'Archive' },
}
