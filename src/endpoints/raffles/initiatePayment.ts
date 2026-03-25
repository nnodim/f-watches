import { addDataAndFileToRequest, type Endpoint } from 'payload'

import { currenciesConfig } from '@/lib/constants'

const isRecentPendingPurchase = (createdAt?: null | string) => {
  if (!createdAt) return false
  const createdAtTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdAtTime)) return false

  return Date.now() - createdAtTime <= 30 * 60 * 1000
}

const getReservedTickets = async (
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
  raffleID: string,
) => {
  const purchases = await req.payload.find({
    collection: 'raffle-purchases',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    req,
    where: {
      and: [
        {
          raffle: {
            equals: raffleID,
          },
        },
        {
          status: {
            in: ['pending', 'paid'],
          },
        },
      ],
    },
  })

  return purchases.docs.reduce((sum, purchase) => {
    if (purchase.status === 'paid') return sum + (purchase.quantity || 0)
    if (purchase.status === 'pending' && isRecentPendingPurchase(purchase.createdAt)) {
      return sum + (purchase.quantity || 0)
    }
    return sum
  }, 0)
}

export const initiateRafflePaymentEndpoint: Endpoint = {
  method: 'post',
  path: '/:id/initiate-payment',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const raffleID = typeof req.routeParams?.id === 'string' ? req.routeParams.id : null
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!raffleID) {
      return Response.json({ message: 'Raffle ID is required.' }, { status: 400 })
    }

    if (!secretKey) {
      return Response.json({ message: 'Paystack secret key is required.' }, { status: 500 })
    }

    const requestedQuantity =
      typeof req.data?.quantity === 'number'
        ? req.data.quantity
        : Number.parseInt(String(req.data?.quantity || '1'), 10)
    const quantity = Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1
    const customerEmail =
      req.user?.email ||
      (typeof req.data?.customerEmail === 'string' ? req.data.customerEmail.trim() : '')

    if (!customerEmail) {
      return Response.json({ message: 'Customer email is required.' }, { status: 400 })
    }

    const raffle = await req.payload.findByID({
      collection: 'raffles',
      id: raffleID,
      depth: 0,
      overrideAccess: false,
      req,
      select: {
        id: true,
        title: true,
        drawDate: true,
        ticketPrice: true,
        maxTickets: true,
        status: true,
      },
    })

    if (!raffle) {
      return Response.json({ message: 'Raffle not found.' }, { status: 404 })
    }

    if (raffle.status === 'drawn' || raffle.status === 'cancelled') {
      return Response.json({ message: 'This raffle is no longer available.' }, { status: 400 })
    }

    if (!raffle.ticketPrice || raffle.ticketPrice <= 0) {
      return Response.json({ message: 'This raffle has no valid ticket price.' }, { status: 400 })
    }

    if (new Date(raffle.drawDate) <= new Date()) {
      return Response.json({ message: 'Ticket sales are closed for this raffle.' }, { status: 400 })
    }

    const reservedTickets = await getReservedTickets(req, raffleID)

    if (typeof raffle.maxTickets === 'number' && reservedTickets + quantity > raffle.maxTickets) {
      return Response.json({ message: 'Not enough tickets remaining for this raffle.' }, { status: 400 })
    }

    const amount = raffle.ticketPrice * quantity
    const reference = `raffle_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const purchase = await req.payload.create({
      collection: 'raffle-purchases',
      data: {
        amount,
        currency: currenciesConfig.defaultCurrency,
        customer: req.user?.id,
        customerEmail,
        paymentReference: reference,
        quantity,
        raffle: raffleID,
        status: 'pending',
      },
      req,
    })

    const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        callback_url: `${req.protocol}://${req.host}/raffles/${raffleID}`,
        currency: currenciesConfig.defaultCurrency,
        email: customerEmail,
        metadata: {
          raffleID,
          rafflePurchaseID: purchase.id,
          quantity,
        },
        reference,
      }),
    })

    if (!initializeResponse.ok) {
      await req.payload.delete({
        collection: 'raffle-purchases',
        id: purchase.id,
        req,
      })

      return Response.json({ message: 'Unable to initialize payment.' }, { status: 500 })
    }

    const initializeData = await initializeResponse.json()

    return Response.json({
      accessCode: initializeData.data.access_code,
      authorizationUrl: initializeData.data.authorization_url,
      reference,
    })
  },
}
