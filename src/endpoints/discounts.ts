import type { Endpoint } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { normalizeCode } from '@/lib/discounts'

export const applyDiscountEndpoint: Endpoint = {
  method: 'post',
  path: '/discounts/apply',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const payload = req.payload
    const { code, cartID, secret } = (req.data || {}) as {
      code?: string
      cartID?: string
      secret?: string
    }

    if (!cartID) {
      return Response.json({ message: 'Cart ID is required.' }, { status: 400 })
    }

    const cart = await payload.findByID({
      collection: 'carts',
      id: cartID,
      depth: 2,
      overrideAccess: true,
      select: {
        id: true,
        secret: true,
        customer: true,
        items: true,
        currency: true,
        subtotal: true,
        total: true,
        discountCode: true,
        discountReason: true,
        discountAmountInNGN: true,
        discountAmountInUSD: true,
      },
    })

    if (!cart) {
      return Response.json({ message: 'Cart not found.' }, { status: 404 })
    }

    const cartCustomerId =
      typeof cart.customer === 'string' ? cart.customer : cart.customer?.id

    if (req.user?.id) {
      if (cartCustomerId && cartCustomerId !== req.user.id) {
        return Response.json({ message: 'Unauthorized cart access.' }, { status: 403 })
      }
    } else {
      if (!secret || typeof cart.secret !== 'string' || cart.secret !== secret) {
        return Response.json({ message: 'Cart secret is invalid.' }, { status: 403 })
      }
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      const updatedCart = await payload.update({
        collection: 'carts',
        id: cartID,
        data: {
          discountCode: null,
          discountReason: undefined,
        },
        overrideAccess: true,
      })

      return Response.json({ doc: updatedCart })
    }

    const normalized = normalizeCode(code)

    const discountResults = await payload.find({
      collection: 'discount-codes',
      limit: 1,
      pagination: false,
      where: {
        code: {
          equals: normalized,
        },
      },
      overrideAccess: true,
    })

    const discountCode = discountResults.docs?.[0]

    if (!discountCode) {
      return Response.json({ message: 'Discount code not found.' }, { status: 404 })
    }

    const updatedCart = await payload.update({
      collection: 'carts',
      id: cartID,
      data: {
        discountCode: discountCode.id,
      },
      overrideAccess: true,
    })

    return Response.json({ doc: updatedCart })
  },
}
