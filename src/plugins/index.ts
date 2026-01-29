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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const cloudinaryAdapter = () => ({
  name: 'cloudinary-adapter',
  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    try {
      // createing a function that will upload your file in cloudinary
      // Uploading the file to Cloudinary using upload_stream.
      // Since Cloudinary's upload_stream is callback-based, we wrap it in a Promise
      // so we can use async/await syntax for cleaner, easier handling.
      // It uploads the file with a specific public_id under "media/", without overwriting existing files.
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto', // auto-detect file type (image, video, etc.)
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, '')}`, // Set custom file name without extension, and it also previxed the cleaned filename with media/
            overwrite: false, // Do not overwrite if a file with the same name exists
            use_filename: true, // Use original filename
          },
          (error, result) => {
            if (error) return reject(error)
            if (!result) return reject(new Error('No result returned from Cloudinary'))
            resolve(result) // hanlde result
          },
        )
        uploadStream.end(file.buffer) // this line send the file to cloudinary it means entire file is already in memory and will be send whole thing at once not in chunk
      })
      file.filename = uploadResult.public_id // Use Cloudinary's public_id as the file's unique name
      file.mimeType = `${uploadResult.format}` // Set MIME type based on Cloudinary's format (e.g., image/png)
      file.filesize = uploadResult.bytes // Set the actual file size in bytes, for admin display and validations
    } catch (err) {
      console.error('Upload Error', err)
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    console.log('handleDelete has been called')

    // if filename is present then we will look for that file
    try {
      // We remove the file extension from the filename and then target the file
      // inside the "media/" folder on Cloudinary (which we used as the upload path)
      await cloudinary.uploader.destroy(`media/${filename.replace(/\.[^/.]+$/, '')}`)
    } catch (error) {
      // if something error occured we will catch the error and respond the error in console
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

    const cloudinaryUrl = cloudinary.url(`media/${filename}`, {
      secure: true,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })

    return Response.redirect(cloudinaryUrl, 302)
  },
})

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

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
          return cloudinary.url(`media/${filename}`, { secure: true })
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
    },
    currencies: currenciesConfig,
  }),
]
