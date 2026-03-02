import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { currenciesConfig } from '@/lib/constants'
import { paystackAdapterClient } from '@/payment/paystack'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            api={{
              cartsFetchQuery: {
                depth: 2,
                select: {
                  items: true,
                  subtotal: true,
                  total: true,
                  discountCode: true,
                  discountAmountInNGN: true,
                  discountAmountInUSD: true,
                },
                populate: {
                  products: {
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                    saleEnabled: true,
                    saleStart: true,
                    saleEnd: true,
                    salePriceInNGN: true,
                    salePriceInUSD: true,
                  },
                  variants: {
                    title: true,
                    inventory: true,
                    saleEnabled: true,
                    saleStart: true,
                    saleEnd: true,
                    salePriceInNGN: true,
                    salePriceInUSD: true,
                  },
                },
              },
            }}
            currenciesConfig={currenciesConfig}
            paymentMethods={[
              paystackAdapterClient({
                publicKey: 'pk_test_xxx',
              }),
              stripeAdapterClient({
                publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
              }),
            ]}
          >
            {children}
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
