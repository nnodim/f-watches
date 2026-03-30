import { addDataAndFileToRequest, type Endpoint } from 'payload'

import {
  createEntriesForPurchase,
  getTicketNumbersByPurchase,
  sendRafflePurchaseConfirmationEmail,
} from '@/lib/raffles'

const getAvailableTickets = async (
  req: Parameters<NonNullable<Endpoint['handler']>>[0],
  raffleID: string,
  maxTickets?: number | null,
) => {
  if (typeof maxTickets !== 'number') return Number.POSITIVE_INFINITY

  const entries = await req.payload.find({
    collection: 'raffle-entries',
    depth: 0,
    limit: 5000,
    pagination: false,
    req,
    where: {
      raffle: {
        equals: raffleID,
      },
    },
  })

  return Math.max(maxTickets - entries.docs.length, 0)
}

export const confirmRafflePaymentEndpoint: Endpoint = {
  method: 'post',
  path: '/confirm-payment',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const reference =
      typeof req.data?.paymentReference === 'string' ? req.data.paymentReference : null
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!reference || !secretKey) {
      return Response.json({ message: 'Invalid payment confirmation request.' }, { status: 400 })
    }

    const purchases = await req.payload.find({
      collection: 'raffle-purchases',
      depth: 1,
      limit: 1,
      pagination: false,
      req,
      where: {
        paymentReference: {
          equals: reference,
        },
      },
    })

    const purchase = purchases.docs[0]

    if (!purchase) {
      return Response.json({ message: 'Purchase not found.' }, { status: 404 })
    }

    if (purchase.status === 'paid' && purchase.entriesCreatedAt) {
      return Response.json({
        confirmationToken: purchase.confirmationToken,
        message: 'Payment already confirmed.',
        purchaseID: purchase.id,
        raffleSlug:
          purchase.raffle && typeof purchase.raffle === 'object' && 'slug' in purchase.raffle
            ? purchase.raffle.slug
            : undefined,
      })
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!verifyResponse.ok) {
      return Response.json({ message: 'Unable to verify transaction.' }, { status: 500 })
    }

    const verifyData = await verifyResponse.json()
    const paymentData = verifyData.data

    if (paymentData.status !== 'success') {
      await req.payload.update({
        collection: 'raffle-purchases',
        id: purchase.id,
        data: {
          status: 'failed',
        },
        overrideAccess: true,
        req,
      })

      return Response.json({ message: 'Transaction was not successful.' }, { status: 400 })
    }

    const raffleID =
      purchase.raffle && typeof purchase.raffle === 'object' ? purchase.raffle.id : purchase.raffle
    const raffle =
      purchase.raffle && typeof purchase.raffle === 'object'
        ? purchase.raffle
        : raffleID
          ? await req.payload.findByID({
              collection: 'raffles',
              id: raffleID,
              depth: 0,
              overrideAccess: false,
              req,
              select: {
                drawDate: true,
                id: true,
                maxTickets: true,
                slug: true,
                title: true,
              },
            })
          : null

    if (!raffle || new Date(raffle.drawDate) <= new Date()) {
      return Response.json({ message: 'This raffle is no longer accepting entries.' }, { status: 400 })
    }

    const remainingTickets = await getAvailableTickets(req, raffle.id, raffle.maxTickets)

    if (remainingTickets < purchase.quantity) {
      return Response.json({ message: 'This raffle has sold out.' }, { status: 400 })
    }

    await req.payload.update({
      collection: 'raffle-purchases',
      id: purchase.id,
      data: {
        paidAt: paymentData.paid_at,
        status: 'paid',
      },
      overrideAccess: true,
      req,
    })

    await createEntriesForPurchase({
      payload: req.payload,
      purchaseID: purchase.id,
      req,
    })

    const ticketNumbers = await getTicketNumbersByPurchase({
      payload: req.payload,
      purchaseID: purchase.id,
      req,
    })

    if (!purchase.confirmationEmailSentAt && purchase.customerEmail) {
      await sendRafflePurchaseConfirmationEmail({
        confirmationToken: purchase.confirmationToken,
        customerEmail: purchase.customerEmail,
        payload: req.payload,
        quantity: purchase.quantity,
        raffleSlug: raffle.slug,
        ticketNumbers,
        raffleTitle: raffle.title,
      })

      await req.payload.update({
        collection: 'raffle-purchases',
        id: purchase.id,
        data: {
          confirmationEmailSentAt: new Date().toISOString(),
        },
        overrideAccess: true,
        req,
      })
    }

    return Response.json({
      confirmationToken: purchase.confirmationToken,
      message: 'Payment confirmed.',
      purchaseID: purchase.id,
      raffleID: raffle.id,
      raffleSlug: raffle.slug,
    })
  },
}
