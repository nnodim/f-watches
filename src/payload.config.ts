import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'
import { analyticsEndpoint } from './endpoints/analytics'
import { applyDiscountEndpoint } from './endpoints/discounts'
import { paystackInitiateDiscountedEndpoint } from './endpoints/payments/paystackInitiate'
import { Posts } from './collections/Post'
import { PostCategories } from './collections/PostCategories'
import { Expenses } from './collections/Expenses'
import { DiscountCodes } from './collections/DiscountCodes'
import { DebtPayments } from './collections/DebtPayments'
import { Raffles } from './collections/Raffles'
import { RaffleEntries } from './collections/RaffleEntries'
import { RafflePurchases } from './collections/RafflePurchases'
import { RaffleBonusActions } from './collections/RaffleBonusActions'
import { runDueRafflesEndpoint, runDueRafflesGetEndpoint } from './endpoints/raffles/runDueDraws'
import { initiateRafflePaymentEndpoint } from './endpoints/raffles/initiatePayment'
import { confirmRafflePaymentEndpoint } from './endpoints/raffles/confirmPayment'
import { submitRaffleBonusActionEndpoint } from './endpoints/raffles/submitBonusAction'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    meta: {
      icons: [
        {
          rel: 'icon',
          url: '/favicon.ico',
        },
      ],
    },
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
      views: {
        analytics: {
          Component: '@/components/AdminAnalytics/index.tsx',
          path: '/analytics',
        },
      },
      beforeNavLinks: [{ path: '@/components/AfterNavLinks/index.tsx' }],
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Expenses,
    DiscountCodes,
    DebtPayments,
    Raffles,
    RaffleEntries,
    RafflePurchases,
    RaffleBonusActions,
    Pages,
    Posts,
    PostCategories,
    Categories,
    Media,
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  endpoints: [
    analyticsEndpoint,
    applyDiscountEndpoint,
    paystackInitiateDiscountedEndpoint,
    runDueRafflesEndpoint,
    runDueRafflesGetEndpoint,
    initiateRafflePaymentEndpoint,
    confirmRafflePaymentEndpoint,
    submitRaffleBonusActionEndpoint,
  ],
  globals: [Header, Footer],
  email: resendAdapter({
    defaultFromAddress: 'admin@bellissimoeee.com',
    defaultFromName: 'Fwatches',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
