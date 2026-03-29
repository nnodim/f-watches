import { addDataAndFileToRequest, type Endpoint } from 'payload'

const bonusEntriesByAction = {
  follow: 1,
  repost: 1,
  'tag-friends': 1,
} as const

const validActionTypes = Object.keys(bonusEntriesByAction) as Array<keyof typeof bonusEntriesByAction>

export const submitRaffleBonusActionEndpoint: Endpoint = {
  method: 'post',
  path: '/bonus-actions/submit',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const purchaseID = typeof req.data?.purchaseID === 'string' ? req.data.purchaseID : null
    const socialHandle =
      typeof req.data?.socialHandle === 'string' ? req.data.socialHandle.trim() : ''
    const guestEmail =
      typeof req.data?.customerEmail === 'string' ? req.data.customerEmail.trim() : ''
    const selectedActions = Array.isArray(req.data?.selectedActions)
      ? req.data.selectedActions.filter((value): value is string => typeof value === 'string')
      : []

    if (!purchaseID || !socialHandle) {
      return Response.json({ message: 'Missing required bonus activity fields.' }, { status: 400 })
    }

    const invalidAction = selectedActions.find(
      (action) => !validActionTypes.includes(action as keyof typeof bonusEntriesByAction),
    )

    if (invalidAction) {
      return Response.json({ message: 'Invalid bonus action type.' }, { status: 400 })
    }

    const purchase = await req.payload.findByID({
      collection: 'raffle-purchases',
      id: purchaseID,
      depth: 0,
      overrideAccess: false,
      req,
      select: {
        customer: true,
        customerEmail: true,
        raffle: true,
        status: true,
      },
    })

    if (!purchase || purchase.status !== 'paid') {
      return Response.json({ message: 'A paid raffle purchase is required.' }, { status: 400 })
    }

    const purchaseCustomerID =
      purchase.customer && typeof purchase.customer === 'object'
        ? purchase.customer.id
        : purchase.customer || undefined
    const purchaseEmail = purchase.customerEmail?.trim()

    if (req.user) {
      if (purchaseCustomerID !== req.user.id) {
        return Response.json({ message: 'This purchase does not belong to you.' }, { status: 403 })
      }
    } else if (!purchaseEmail || guestEmail.toLowerCase() !== purchaseEmail.toLowerCase()) {
      return Response.json({ message: 'Enter the email used for ticket purchase.' }, { status: 403 })
    }

    const raffleID = typeof purchase.raffle === 'object' ? purchase.raffle.id : purchase.raffle
    const existing = await req.payload.find({
      collection: 'raffle-bonus-actions',
      depth: 0,
      limit: 50,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        purchase: {
          equals: purchaseID,
        },
      },
    })

    const existingMap = new Map(existing.docs.map((doc) => [doc.actionType, doc]))

    for (const actionType of validActionTypes) {
      const current = existingMap.get(actionType)
      const isSelected = selectedActions.includes(actionType)

      if (isSelected) {
        if (!current) {
          await req.payload.create({
            collection: 'raffle-bonus-actions',
            data: {
              actionType,
              bonusEntryCount: bonusEntriesByAction[actionType],
              customer: purchaseCustomerID,
              customerEmail: purchaseEmail,
              purchase: purchaseID,
              raffle: raffleID,
              socialHandle,
              status: 'pending',
            } as any,
            req,
          })
          continue
        }

        if (current.status === 'rejected') {
          await req.payload.update({
            collection: 'raffle-bonus-actions',
            id: current.id,
            data: {
              reviewedAt: undefined,
              reviewedBy: undefined,
              socialHandle,
              status: 'pending',
            },
            req,
          })
        }

        if (current.status === 'pending' && current.socialHandle !== socialHandle) {
          await req.payload.update({
            collection: 'raffle-bonus-actions',
            id: current.id,
            data: {
              socialHandle,
            },
            req,
          })
        }

        continue
      }

      if (current?.status === 'pending' || current?.status === 'rejected') {
        await req.payload.delete({
          collection: 'raffle-bonus-actions',
          id: current.id,
          req,
        })
      }
    }

    return Response.json({
      message: 'Bonus activity checklist updated.',
    })
  },
}
