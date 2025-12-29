import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { InitiatePaymentReturnType, PaystackAdapterArgs } from './index.js'

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
    const amount = cart.subtotal

    // 1. Validations
    if (!secretKey) throw new Error('Paystack secret key is required.')
    if (!currency) throw new Error('Currency is required.')
    if (!cart?.items?.length) throw new Error('Cart is empty.')
    if (!customerEmail) throw new Error('Customer email is required.')
    if (!amount || amount <= 0) throw new Error('Valid amount is required.')

    try {
      // 2. Prepare Data synchronously
      const flattenedCart = cart.items.map((item) => ({
        product: typeof item.product === 'object' ? item.product.id : item.product,
        quantity: item.quantity,
        variant: item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined,
      }))

      const reference = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // 3. Parallel Execution: Paystack Init + Payload Transaction Creation

      // We can create the local transaction record WHILE waiting for Paystack.
      // If Paystack fails, we can delete the transaction or mark it failed, but usually, we want the record regardless.

      const paystackBody = {
        email: customerEmail,
        amount: Math.round(amount), // Ensure integer (kobo/cents)
        currency: currency.toUpperCase(),
        reference,
        callback_url: `${req.protocol}://${req.host}/api/payments/paystack/callback`,
        metadata: {
          cartID: cart.id,
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
            items: flattenedCart,
            paymentMethod: 'paystack',
            status: 'pending',
            paystack: {
              reference: reference,
              // Note: We don't have accessCode yet, we update it after init if strict strictness is needed,
              // but usually reference is enough for correlation.
            },
          },
        }),
      ])

      if (!initializeResponse.ok) {
        const errorData = await initializeResponse.json()
        // Rollback transaction if Paystack fails (optional, but good for data hygiene)
        await payload.delete({ collection: 'transactions', id: transaction.id })
        throw new Error(`Paystack initialization failed: ${errorData.message}`)
      }

      const initializeData = await initializeResponse.json()

      // Optional: Update the transaction with the Paystack Access Code/Customer Code if absolutely necessary
      // However, for speed, we often skip this write as the Webhook will update the transaction later.
      // If you strictly need the access code in DB now:
      // await payload.update({ collection: 'transactions', id: transaction.id, data: { paystack: { accessCode: initializeData.data.access_code }}})

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
