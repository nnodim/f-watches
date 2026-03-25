import type { Endpoint, Payload, PayloadRequest } from 'payload'

import type { Raffle, RaffleEntry } from '@/payload-types'

type DrawWinner = {
  discountCodeID: string
  discountCodeValue: string
  entryID: string
  raffleID: string
  rewardType: 'free-watch' | 'half-off'
}

const isObjectWithID = (value: unknown): value is { id: string } => {
  return Boolean(value && typeof value === 'object' && 'id' in value)
}

const toID = (value: unknown): null | string => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (isObjectWithID(value)) return value.id
  return null
}

const toEmail = (value: unknown): null | string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

const buildTicketNumber = (raffleID: string, index: number) => {
  return `RFL-${raffleID.slice(0, 6).toUpperCase()}-${index}`
}

const buildRewardCode = (rewardType: 'free-watch' | 'half-off') => {
  const prefix = rewardType === 'free-watch' ? 'FREE' : 'HALF'
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `RAFFLE-${prefix}-${suffix}`
}

const shuffle = <T>(items: T[]) => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!]
  }

  return copy
}

const getRewardPlan = (
  raffle: Pick<Raffle, 'prizeType'>,
): { percentage: number; rewardType: 'free-watch' | 'half-off' } => {
  if (raffle.prizeType === 'free') {
    return { percentage: 100, rewardType: 'free-watch' }
  }

  return { percentage: 50, rewardType: 'half-off' }
}

const sendWinnerEmail = async (args: {
  code: string
  customerEmail: string
  payload: Payload
  raffleTitle: string
  rewardType: 'free-watch' | 'half-off'
}) => {
  const { code, customerEmail, payload, raffleTitle, rewardType } = args
  const rewardLabel = rewardType === 'free-watch' ? 'a free watch' : '50% off a watch'

  await payload.sendEmail({
    to: customerEmail,
    subject: `You won ${rewardLabel} in ${raffleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Congratulations</h2>
        <p>You were selected as a winner in <strong>${raffleTitle}</strong>.</p>
        <p>Your reward: <strong>${rewardLabel}</strong>.</p>
        <p>Your one-time code is <strong>${code}</strong>.</p>
        <p>Apply the code at checkout on an eligible watch product.</p>
      </div>
    `,
  })
}

export const createEntriesForPurchase = async (args: {
  payload: Payload
  purchaseID: string
  req: PayloadRequest
}) => {
  const { payload, purchaseID, req } = args
  const purchase = await payload.findByID({
    collection: 'raffle-purchases',
    id: purchaseID,
    depth: 0,
    overrideAccess: false,
    req,
    select: {
      customer: true,
      customerEmail: true,
      entriesCreatedAt: true,
      quantity: true,
      raffle: true,
    },
  })

  if (purchase.entriesCreatedAt) return

  const raffleID = toID(purchase.raffle)
  const customerEmail = toEmail(purchase.customerEmail)

  if (!raffleID || !customerEmail) {
    throw new Error('Raffle purchase is missing required data.')
  }

  const count = await payload.count({
    collection: 'raffle-entries',
    overrideAccess: false,
    req,
  })

  for (let entryIndex = 0; entryIndex < purchase.quantity; entryIndex += 1) {
    const index = count.totalDocs + entryIndex
    await payload.create({
      collection: 'raffle-entries',
      data: {
        entrySource: 'purchase',
        customer: toID(purchase.customer) || undefined,
        customerEmail,
        purchase: purchaseID,
        raffle: raffleID,
        rewardType: 'none',
        status: 'active',
        ticketNumber: buildTicketNumber(raffleID, (index + 1) as number),
      },
      req,
    })
  }

  await payload.update({
    collection: 'raffle-purchases',
    id: purchaseID,
    data: {
      entriesCreatedAt: new Date().toISOString(),
    },
    req,
  })
}

export const drawRaffle = async (args: {
  payload: Payload
  raffleID: string
  req: PayloadRequest
}) => {
  const { payload, raffleID, req } = args
  const raffle = await payload.findByID({
    collection: 'raffles',
    id: raffleID,
    depth: 1,
    overrideAccess: false,
    req,
    select: {
      drawDate: true,
      eligibleProducts: true,
      id: true,
      prizeType: true,
      rewardCodeExpiresAt: true,
      status: true,
      title: true,
      winnerEntry: true,
    },
  })

  if (!raffle) {
    throw new Error('Raffle not found.')
  }

  if (raffle.status === 'drawn' || raffle.winnerEntry) {
    throw new Error('This raffle has already been drawn.')
  }

  if (!raffle.drawDate || new Date(raffle.drawDate) > new Date()) {
    throw new Error('This raffle cannot be drawn before its draw date.')
  }

  const eligibleProductIDs = (raffle.eligibleProducts || [])
    .map((product) => toID(product))
    .filter((value): value is string => Boolean(value))

  if (eligibleProductIDs.length === 0) {
    throw new Error('Add at least one eligible prize product before drawing the raffle.')
  }

  const entries = await payload.find({
    collection: 'raffle-entries',
    depth: 0,
    limit: 5000,
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
            equals: 'active',
          },
        },
      ],
    },
  })

  if (!entries.docs.length) {
    throw new Error('There are no active ticket entries for this raffle.')
  }

  const shuffledEntries = shuffle(entries.docs as RaffleEntry[])
  const winnerEntry = shuffledEntries.shift()

  if (!winnerEntry) {
    throw new Error('There are no eligible entries to draw.')
  }

  const now = new Date().toISOString()
  const plan = getRewardPlan(raffle)
  const discountCodeValue = buildRewardCode(plan.rewardType)
  const discountCode = await payload.create({
    collection: 'discount-codes',
    data: {
      active: true,
      appliesTo: 'products',
      code: discountCodeValue,
      endsAt: raffle.rewardCodeExpiresAt || undefined,
      maxUses: 1,
      name: `${raffle.title} ${plan.rewardType} reward`,
      percentage: plan.percentage,
      products: eligibleProductIDs,
      startsAt: now,
      type: 'percentage',
      uses: 0,
    },
    req,
  })

  await payload.update({
    collection: 'raffle-entries',
    id: winnerEntry.id,
    data: {
      drawnAt: now,
      rewardCode: discountCodeValue,
      rewardDiscountCode: discountCode.id,
      rewardType: plan.rewardType,
      status: 'winner',
    },
    req,
  })

  for (const entry of shuffledEntries) {
    await payload.update({
      collection: 'raffle-entries',
      id: entry.id,
      data: {
        drawnAt: now,
        status: 'not-selected',
      },
      req,
    })
  }

  const customerEmail = toEmail(winnerEntry.customerEmail)
  if (customerEmail) {
    await sendWinnerEmail({
      code: discountCodeValue,
      customerEmail,
      payload,
      raffleTitle: raffle.title,
      rewardType: plan.rewardType,
    })
  }

  await payload.update({
    collection: 'raffles',
    id: raffleID,
    data: {
      drawnAt: now,
      status: 'drawn',
      winnerEntry: winnerEntry.id,
    },
    req,
  })

  return [
    {
      discountCodeID: discountCode.id,
      discountCodeValue,
      entryID: winnerEntry.id,
      raffleID,
      rewardType: plan.rewardType,
    },
  ] satisfies DrawWinner[]
}

export const runDueRaffles = async (args: { payload: Payload; req: PayloadRequest }) => {
  const { payload, req } = args
  const now = new Date().toISOString()
  const dueRaffles = await payload.find({
    collection: 'raffles',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    req,
    where: {
      and: [
        {
          drawDate: {
            less_than_equal: now,
          },
        },
        {
          status: {
            in: ['scheduled', 'open'],
          },
        },
      ],
    },
  })

  const results = [] as Array<{
    error?: string
    raffleID: string
    winners?: DrawWinner[]
  }>

  for (const raffle of dueRaffles.docs) {
    try {
      const winners = await drawRaffle({
        payload,
        raffleID: raffle.id,
        req,
      })

      results.push({
        raffleID: raffle.id,
        winners,
      })
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : 'Unable to draw raffle.',
        raffleID: raffle.id,
      })
    }
  }

  return results
}

export const buildRaffleDrawEndpoint = (): Endpoint => ({
  method: 'post',
  path: '/draw/:id',
  handler: async (req) => {
    if (!req.user?.roles?.includes('admin')) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const raffleID = typeof req.routeParams?.id === 'string' ? req.routeParams.id : null

    if (!raffleID) {
      return Response.json({ message: 'Raffle ID is required' }, { status: 400 })
    }

    try {
      const winners = await drawRaffle({
        payload: req.payload,
        raffleID,
        req,
      })

      return Response.json({
        message: 'Raffle drawn successfully.',
        winners,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to draw raffle.'
      return Response.json({ message }, { status: 400 })
    }
  },
})
