import { addDataAndFileToRequest, type DefaultDocumentIDType, type Endpoint } from 'payload'

import { initiatePayment } from '@/payment/paystack/initiatePayment'
import { currenciesConfig } from '@/lib/constants'

export const paystackInitiateDiscountedEndpoint: Endpoint = {
  method: 'post',
  path: '/payments/paystack/initiate-discounted',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const payload = req.payload
    const data = req.data || {}
    const user = req.user

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return Response.json({ message: 'Paystack secret key is required.' }, { status: 500 })
    }

    let currency = currenciesConfig.defaultCurrency
    let cartID: DefaultDocumentIDType | undefined = data.cartID
    let cart = undefined as any
    const billingAddress = data.billingAddress
    const shippingAddress = data.shippingAddress
    const cartSecret = data.secret

    let customerEmail = user?.email ?? ''

    if (user) {
      if (user.cart?.docs && Array.isArray(user.cart.docs) && user.cart.docs.length > 0) {
        if (!cartID && user.cart.docs[0]) {
          if (typeof user.cart.docs[0] === 'object') {
            cartID = user.cart.docs[0].id
            cart = user.cart.docs[0]
          } else {
            cartID = user.cart.docs[0]
          }
        }
      }
    } else {
      if (data?.customerEmail && typeof data.customerEmail === 'string') {
        customerEmail = data.customerEmail
      } else {
        return Response.json(
          { message: 'A customer email is required to make a purchase.' },
          { status: 400 },
        )
      }
    }

    if (!cart) {
      if (!cartID) {
        return Response.json({ message: 'Cart ID is required.' }, { status: 400 })
      }

      if (cartSecret && typeof cartSecret === 'string') {
        req.query = req.query || {}
        req.query.secret = cartSecret
      }

      cart = await payload.findByID({
        id: cartID,
        collection: 'carts',
        depth: 2,
        overrideAccess: false,
        req,
        select: {
          currency: true,
          items: true,
          subtotal: true,
          total: true,
          discountCode: true,
          discountAmountInNGN: true,
          discountAmountInUSD: true,
        },
      })      

      if (!cart) {
        return Response.json({ message: `Cart with ID ${cartID} not found.` }, { status: 404 })
      }
    }

    if (cart.currency && typeof cart.currency === 'string') {
      currency = cart.currency
    }

    if (!currency) {
      return Response.json({ message: 'Currency is required.' }, { status: 400 })
    }

    if (!cart?.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return Response.json(
        { message: 'Cart is required and must contain at least one item.' },
        { status: 400 },
      )
    }

    try {
      const paymentResponse = await initiatePayment({ secretKey })({
        data: {
          billingAddress,
          cart,
          currency,
          customerEmail,
          shippingAddress,
        },
        req,
        transactionsSlug: 'transactions',
      })

      return Response.json(paymentResponse)
    } catch (error) {
      payload.logger.error(error, 'Error initiating Paystack payment.')

      return Response.json({ message: 'Error initiating payment.' }, { status: 500 })
    }
  },
}
