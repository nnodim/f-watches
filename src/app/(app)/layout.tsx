import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import localFont from 'next/font/local'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Instrument_Sans, Montserrat, EB_Garamond } from 'next/font/google'
import './globals.css'

/* const { SITE_NAME, TWITTER_CREATOR, TWITTER_SITE } = process.env
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000'
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined
 */
/* export const metadata = {
  metadataBase: new URL(baseUrl),
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite,
      },
    }),
} */

const myFont = localFont({
  variable: '--font-bitcount-grid',
  src: './fonts/BitcountGridSingle-VariableFont_CRSV,ELSH,ELXP,slnt,wght.ttf',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      className={[
        GeistSans.variable,
        GeistMono.variable,
        instrumentSans.variable,
        montserrat.variable,
        ebGaramond.variable,
        myFont.variable,
      ]
        .filter(Boolean)
        .join(' ')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        {/* <link href="/favicon.svg" rel="icon" type="image/svg+xml" /> */}
      </head>
      <body>
        <Providers>
          <AdminBar />
          <LivePreviewListener />

          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
