import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { PayloadRequest, Plugin } from 'payload'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { authenticated } from '@/access/isAuthenticated'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { ProductsCollection } from '@/collections/Products'
import { currenciesConfig } from '@/lib/constants'
import { Page, Product } from '@/payload-types'
import { paystackAdapter } from '@/payment/paystack'
import { getServerSideURL } from '@/utilities/getURL'
import type { HandleDelete, HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'
import { v2 as cloudinary } from 'cloudinary'
import { publicAccess } from '@/access/publicAccess'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { searchFields } from '@/search/fieldOverrides'
import { OrdersCollection } from '@/collections/Orders'
import { CartsCollection } from '@/collections/Carts'
import { VariantsCollection } from '@/collections/Variants'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'avi',
  'wmv',
  'flv',
  'mkv',
  'webm',
  'm4v',
  'mpeg',
  'mpg',
  '3gp',
]
const RAW_EXTENSIONS = ['pdf', 'zip', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt']

function getResourceType(filename: string): 'image' | 'video' | 'raw' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (RAW_EXTENSIONS.includes(ext)) return 'raw'
  return 'image'
}

export const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`,
            overwrite: false,
            use_filename: true,
          },
          (error, result) => {
            if (error) return reject(error)
            if (!result) return reject(new Error('No result returned from Cloudinary'))
            resolve(result)
          },
        )
        uploadStream.end(file.buffer)
      })
      file.filename = uploadResult.public_id
      file.mimeType = `${uploadResult.format}`
      file.filesize = uploadResult.bytes
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      const cleanName = filename.replace(/\.[^/.]+$/, '')
      await cloudinary.uploader.destroy(`media/${cleanName}`, {
        resource_type: getResourceType(filename), // <-- match how it was stored
      })
    } catch (error) {
      console.error('Cloudinary Delete Error:', error)
    }
  },

  staticHandler(req: PayloadRequest) {
    if (!req.url) {
      return new Response('Bad request: missing URL', { status: 400 })
    }

    const url = new URL(req.url)
    const filename = url.pathname.split('/').pop()

    if (!filename) {
      return new Response('Filename not found', { status: 404 })
    }

    const resourceType = getResourceType(filename)

    const cloudinaryUrl = cloudinary.url(`media/${filename}`, {
      secure: true,
      resource_type: resourceType, // <-- this was the missing piece
      // image-only transformation — don't apply it to video/raw
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    })

    return Response.redirect(cloudinaryUrl, 302)
  },
})

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts', 'products'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      slug: 'search',
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  cloudStoragePlugin({
    collections: {
      media: {
        adapter: cloudinaryAdapter,

        disableLocalStorage: true,

        generateFileURL: ({ filename }) => {
          return cloudinary.url(`media/${filename}`, {
            secure: true,
            resource_type: getResourceType(filename), // <-- fix here too
          })
        },
      },
    },
  }),
  ecommercePlugin({
    access: {
      isAuthenticated: authenticated,
      publicAccess: publicAccess,
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    carts: {
      allowGuestCarts: true,
      cartsCollectionOverride: CartsCollection,
    },
    customers: {
      slug: 'users',
    },
    payments: {
      paymentMethods: [
        paystackAdapter({
          publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
          secretKey: process.env.PAYSTACK_SECRET_KEY!,
          webhookSecret: 'whsec_xxx',
          webhooks: {
            'charge.success': async ({ event, req }) => {
              console.log('Payment confirmation through Paystack webhook')
              // const { payload } = req
              // const paystackData = event.data
              // const reference = paystackData.reference

              // const transactionsResults = await payload.find({
              //   collection: 'transactions',
              //   where: { 'paystack.reference': { equals: reference } },
              //   depth: 0,
              // })

              // const transaction = transactionsResults.docs[0]

              // if (transaction) {
              //   console.log('Payment confirmation through Paystack webhook')
              //   await handlePaystackSuccess({
              //     payload,
              //     transaction,
              //     paystackData,
              //     req,
              //   })
              // } else {
              //   req.payload.logger.error(`Webhook Error: No transaction found for ref ${reference}`)
              // }
            },
          },
        }),
        stripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    orders: {
      ordersCollectionOverride: OrdersCollection,
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      variants: {
        variantsCollectionOverride: VariantsCollection,
      },
    },
    addresses: {
      supportedCountries: [{ label: 'Nigeria', value: 'NG' }],
    },
    currencies: currenciesConfig,
  }),
]
