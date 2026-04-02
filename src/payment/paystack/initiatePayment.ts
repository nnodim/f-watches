import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { InitiatePaymentReturnType, PaystackAdapterArgs } from './index.js'
import { buildCartSnapshot } from '@/lib/cartSnapshot'
import type { DiscountCodeDoc } from '@/lib/discounts'
import type { Cart } from '@/payload-types'
import { getNigeriaShippingFee } from '@/lib/shipping'
import { handlePaystackSuccess } from '@/lib/utils'

type Props = {
  secretKey: PaystackAdapterArgs['secretKey']
}

function isSupportedCurrency(currency: string): currency is 'NGN' | 'USD' {
  return currency.toUpperCase() === 'NGN' || currency.toUpperCase() === 'USD'
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
    const cartData = cart as Cart
    const shippingFeeResult = getNigeriaShippingFee({
      city: shippingAddressFromData?.city,
      country: shippingAddressFromData?.country,
      currency,
      state: shippingAddressFromData?.state,
    })

    if (shippingFeeResult.amount === null) {
      throw new Error(shippingFeeResult.error)
    }

    const shippingFee = shippingFeeResult.amount

    // 1. Validations
    if (!secretKey) throw new Error('Paystack secret key is required.')
    if (!currency) throw new Error('Currency is required.')
    if (!cart?.items?.length) throw new Error('Cart is empty.')
    if (!customerEmail) throw new Error('Customer email is required.')

    try {
      // 2. Prepare Data synchronously
      const discountCodeValue = cartData.discountCode
      let discountCodeDoc: DiscountCodeDoc | null = null

      if (discountCodeValue) {
        const discountCodeId =
          typeof discountCodeValue === 'object' ? discountCodeValue.id : discountCodeValue
        discountCodeDoc = (await payload.findByID({
          collection: 'discount-codes',
          id: discountCodeId,
          depth: 0,
          select: {
            id: true,
            active: true,
            type: true,
            appliesTo: true,
            percentage: true,
            products: true,
            startsAt: true,
            endsAt: true,
            maxUses: true,
            uses: true,
            amountInNGN: true,
            amountInUSD: true,
            minSubtotalInNGN: true,
            minSubtotalInUSD: true,
          },
        })) as unknown as DiscountCodeDoc
      }

      const cartSnapshot = buildCartSnapshot({
        cart: cartData,
        currency,
        discountCode: discountCodeDoc,
      })
      const grandTotal = cartSnapshot.total + shippingFee

      const reference = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      if (grandTotal <= 0) {
        const transaction = await payload.create({
          collection: 'transactions',
          data: {
            ...(req.user ? { customer: req.user.id } : { customerEmail }),
            amount: 0,
            customerEmail,
            billingAddress: billingAddressFromData,
            cart: cart.id,
            currency: isSupportedCurrency(currency)
              ? (currency.toUpperCase() as 'NGN' | 'USD')
              : null,
            items: cartSnapshot.items,
            paymentMethod: 'paystack',
            status: 'pending',
            paystack: {
              channel: 'discount-code',
              paidAt: new Date().toISOString(),
              reference,
              transactionId: reference,
            },
          },
        })

        const result = await handlePaystackSuccess({
          payload,
          transaction,
          paystackData: {
            amount: 0,
            channel: 'discount-code',
            currency: currency.toUpperCase(),
            customer: {
              email: customerEmail,
            },
            customer_code: null,
            id: reference,
            metadata: {
              cartDiscountAmount: cartSnapshot.discountAmount,
              cartGrandTotal: 0,
              cartID: cart.id,
              cartItemsSnapshot: JSON.stringify(cartSnapshot.items),
              cartShippingFee: shippingFee,
              cartTotal: cartSnapshot.total,
              shippingAddress: JSON.stringify(shippingAddressFromData),
            },
            paid_at: new Date().toISOString(),
            reference,
            status: 'success',
          },
          req,
        })

        return {
          message: 'Order completed successfully.',
          orderID: result.orderID,
          reference,
          transactionID: result.transactionID,
          zeroAmount: true,
        }
      }

      // 3. Parallel Execution: Paystack Init + Payload Transaction Creation

      const paystackBody = {
        email: customerEmail,
        amount: Math.round(grandTotal),
        currency: currency.toUpperCase(),
        reference,
        callback_url: `${req.protocol}://${req.host}/api/payments/paystack/callback`,
        metadata: {
          cartID: cart.id,
          // This snapshot now includes the costPrice for each item
          cartItemsSnapshot: JSON.stringify(cartSnapshot.items),
          cartDiscountAmount: cartSnapshot.discountAmount,
          cartShippingFee: shippingFee,
          cartTotal: cartSnapshot.total,
          cartGrandTotal: grandTotal,
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
            amount: grandTotal,
            customerEmail,
            billingAddress: billingAddressFromData,
            cart: cart.id,
            currency: isSupportedCurrency(currency)
              ? (currency.toUpperCase() as 'NGN' | 'USD')
              : null,
            items: cartSnapshot.items,
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
