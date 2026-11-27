import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { costPricesField } from '@/components/Fields/costPricesField'
import { syncSaleFlags } from '@/hooks/syncSaleFlags'
import { caseMaterialOptions, currenciesConfig, movementOptions } from '@/lib/constants'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { amountField } from '@payloadcms/plugin-ecommerce'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { revalidatePath } from 'next/cache'
import { DefaultDocumentIDType, slugField, Where } from 'payload'
import { syncTaxonomy } from './hooks/syncTaxonomy'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...(defaultCollection.hooks || {}),
    beforeChange: [...(defaultCollection.hooks?.beforeChange || []), syncSaleFlags, syncTaxonomy],
    afterChange: [
      ...(defaultCollection.hooks?.afterChange || []),
      ({ doc, req: { context } }) => {
        if (doc._status === 'published' && !context.disableRevalidate) revalidatePath('/')
      },
    ],
    afterDelete: [
      ...(defaultCollection.hooks?.afterDelete || []),
      ({ doc, req: { context } }) => {
        if (doc._status === 'published' && !context.disableRevalidate) revalidatePath('/')
      },
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    saleEnabled: true,
    gallery: true,
    priceInUSD: true,
    priceInNGN: true,
    salePriceInUSD: true,
    salePriceInNGN: true,
    costPriceInNGN: true,
    costPriceInUSD: true,
    brand: true,
    inventory: true,
    watchCollection: true,
    watchModel: true,
    isLimitedEdition: true,
    meta: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'model',
              type: 'text',
              label: 'Model',
            },
            {
              name: 'saleEnabled',
              type: 'checkbox',
              label: 'Enable sale pricing',
              defaultValue: false,
            },
            {
              name: 'saleStart',
              type: 'date',
              admin: {
                condition: (data) => Boolean(data?.saleEnabled),
              },
            },
            {
              name: 'saleEnd',
              type: 'date',
              admin: {
                condition: (data) => Boolean(data?.saleEnabled),
              },
            },
            ...currenciesConfig.supportedCurrencies.map((currency) =>
              amountField({
                currenciesConfig,
                currency,
                overrides: {
                  name: `salePriceIn${currency.code}`,
                  label: `Sale Price (${currency.code})`,
                  admin: {
                    condition: (data) => Boolean(data?.saleEnabled),
                  },
                },
              }),
            ),
            ...defaultCollection.fields,
            ...costPricesField({ currenciesConfig }),
            {
              name: 'isFeatured',
              type: 'checkbox',
              label: 'Featured product',
              defaultValue: false,
            },
            {
              name: 'isLimitedEdition',
              label: 'Limited Edition',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'isOnSale',
              type: 'checkbox',
              label: 'On sale',
              defaultValue: false,
              admin: {
                readOnly: true,
                description: 'Automatically set when sale pricing is active.',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          label: 'Specs',
          fields: [
            {
              name: 'specs',
              type: 'group',
              label: false,
              fields: [
                { name: 'movement', type: 'select', options: movementOptions, index: true },
                {
                  name: 'caseSize',
                  type: 'number',
                  label: 'Case size (mm)',
                  min: 20,
                  max: 70,
                  index: true,
                },
                { name: 'caseMaterial', type: 'select', options: caseMaterialOptions, index: true },
                { name: 'waterResistance', type: 'number', label: 'Water resistance (m)' },
                {
                  name: 'strapType',
                  type: 'select',
                  options: [
                    { label: 'Leather', value: 'leather' },
                    { label: 'Steel bracelet', value: 'bracelet' },
                    { label: 'Resin', value: 'resin' },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'brand',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      required: true,
      relationTo: 'categories',
    },
    {
      name: 'watchCollection',
      label: 'Collection',
      type: 'relationship',
      relationTo: 'watchCollections',
      index: true,
      admin: { position: 'sidebar' },
      filterOptions: ({ data }) => {
        const brandValue: unknown = data?.brand
        const brands: unknown[] = Array.isArray(brandValue)
          ? brandValue
          : brandValue
            ? [brandValue]
            : []
        const brandIDs = brands
          .map((brand) =>
            typeof brand === 'object' && brand !== null && 'id' in brand ? brand.id : brand,
          )
          .filter(
            (brandID): brandID is DefaultDocumentIDType =>
              typeof brandID === 'string' || typeof brandID === 'number',
          )
        return brandIDs.length ? { brand: { in: brandIDs } } : true
      },
    },
    {
      name: 'watchModel',
      label: 'Model',
      type: 'relationship',
      relationTo: 'watchModels',
      index: true,
      admin: { position: 'sidebar' },
      filterOptions: ({ data }) => {
        const col =
          typeof data?.watchCollection === 'object'
            ? data.watchCollection?.id
            : data?.watchCollection
        return col ? { watchCollection: { equals: col } } : true
      },
    },
    slugField(),
  ],
})
