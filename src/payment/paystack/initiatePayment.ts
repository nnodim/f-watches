import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { InitiatePaymentReturnType, PaystackAdapterArgs } from './index.js'
import { Product } from '@/payload-types.js'

type Props = {
  secretKey: PaystackAdapterArgs['secretKey']
}

function isSupportedCurrency(currency: string): currency is 'NGN' | 'USD' {
  return currency.toUpperCase() === 'NGN' || currency.toUpperCase() === 'USD'
}

function getPriceForCurrency(
  product: Product,
  currency: string,
  priceType: 'price' | 'costPrice',
): number | undefined {
  const key = `${priceType}In${currency.toUpperCase()}` as const

  if (key in product) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (product as Record<string, any>)[key]
  }
  return undefined
}

export const initiatePayment: (props: Props) => NonNullable<PaymentAdapter>['initiatePayment'] =
  (props) =>
  async ({ data, req }) => {
    const payload = req.payload
    const { secretKey } = props || {}
    const {
      customerEmail,
      currency,
      cart,
      billingAddress: billingAddressFromData,
      shippingAddress: shippingAddressFromData,
    } = data
    const amount = cart.subtotal

    // 1. Validations
    if (!secretKey) throw new Error('Paystack secret key is required.')
    if (!currency) throw new Error('Currency is required.')
    if (!cart?.items?.length) throw new Error('Cart is empty.')
    if (!customerEmail) throw new Error('Customer email is required.')
    if (!amount || amount <= 0) throw new Error('Valid amount is required.')

    try {
      // 2. Prepare Data synchronously
      const flattenedCart = cart.items.map((item) => {
        // Helper to determine if product is populated or just an ID
        const product = item.product
        const isProductObject = typeof product === 'object' && product !== null

        return {
          product: isProductObject ? product.id : product,
          quantity: item.quantity,
          variant: item.variant
            ? typeof item.variant === 'object'
              ? item.variant.id
              : item.variant
            : undefined,
          unitPrice: isProductObject ? getPriceForCurrency(product, currency, 'price') : undefined,
          unitCostPrice: isProductObject
            ? getPriceForCurrency(product, currency, 'costPrice')
            : undefined,
        }
      })

      const reference = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // 3. Parallel Execution: Paystack Init + Payload Transaction Creation

      const paystackBody = {
        email: customerEmail,
        amount: Math.round(amount), // Ensure integer (kobo/cents)
        currency: currency.toUpperCase(),
        reference,
        callback_url: `${req.protocol}://${req.host}/api/payments/paystack/callback`,
        metadata: {
          cartID: cart.id,
          // This snapshot now includes the costPrice for each item
          cartItemsSnapshot: JSON.stringify(flattenedCart),
          shippingAddress: JSON.stringify(shippingAddressFromData),
          custom_fields: [
            {
              display_name: 'Cart ID',
              variable_name: 'cart_id',
              value: cart.id.toString(),
            },
          ],
        },
      }

      // Fire both requests simultaneously
      const [initializeResponse, transaction] = await Promise.all([
        fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paystackBody),
        }),
        payload.create({
          collection: 'transactions',
          data: {
            ...(req.user ? { customer: req.user.id } : { customerEmail }),
            amount,
            customerEmail,
            billingAddress: billingAddressFromData,
            cart: cart.id,
            currency: isSupportedCurrency(currency)
              ? (currency.toUpperCase() as 'NGN' | 'USD')
              : null,
            items: flattenedCart, // Note: Transaction schema must allow 'costPrice' in items, or this field will be stripped here (but still present in Paystack metadata)
            paymentMethod: 'paystack',
            status: 'pending',
            paystack: {
              reference: reference,
            },
          },
        }),
      ])

      if (!initializeResponse.ok) {
        const errorData = await initializeResponse.json()
        await payload.delete({ collection: 'transactions', id: transaction.id })
        throw new Error(`Paystack initialization failed: ${errorData.message}`)
      }

      const initializeData = await initializeResponse.json()

      const returnData: InitiatePaymentReturnType = {
        accessCode: initializeData.data.access_code,
        authorizationUrl: initializeData.data.authorization_url,
        message: 'Payment initiated successfully',
        reference: reference,
      }

      return returnData
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment with Paystack')
      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }
