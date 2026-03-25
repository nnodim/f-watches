import { addDataAndFileToRequest, type Endpoint } from 'payload'

const bonusEntriesByAction = {
  follow: 1,
  repost: 2,
  'tag-friends': 1,
  'tag-page': 1,
} as const

const validActionTypes = Object.keys(bonusEntriesByAction) as Array<keyof typeof bonusEntriesByAction>

export const submitRaffleBonusActionEndpoint: Endpoint = {
  method: 'post',
  path: '/bonus-actions/submit',
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const purchaseID = typeof req.data?.purchaseID === 'string' ? req.data.purchaseID : null
    const actionType = typeof req.data?.actionType === 'string' ? req.data.actionType : null
    const socialHandle = typeof req.data?.socialHandle === 'string' ? req.data.socialHandle.trim() : ''
    const notes = typeof req.data?.notes === 'string' ? req.data.notes.trim() : ''
    const guestEmail = typeof req.data?.customerEmail === 'string' ? req.data.customerEmail.trim() : ''

    if (!purchaseID || !actionType || !socialHandle) {
      return Response.json({ message: 'Missing required bonus action fields.' }, { status: 400 })
    }

    if (!validActionTypes.includes(actionType as keyof typeof bonusEntriesByAction)) {
      return Response.json({ message: 'Invalid bonus action type.' }, { status: 400 })
    }

    const normalizedActionType = actionType as keyof typeof bonusEntriesByAction
    const requiresScreenshot = normalizedActionType !== 'follow'

    if (requiresScreenshot && !req.file) {
      return Response.json(
        { message: 'Upload a screenshot for this bonus action.' },
        { status: 400 },
      )
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

    const existing = await req.payload.find({
      collection: 'raffle-bonus-actions',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        and: [
          {
            purchase: {
              equals: purchaseID,
            },
          },
          {
            actionType: {
              equals: actionType,
            },
          },
        ],
      },
    })

    if (existing.docs.length > 0) {
      return Response.json({ message: 'You already submitted proof for this action.' }, { status: 400 })
    }

    const raffleID = typeof purchase.raffle === 'object' ? purchase.raffle.id : purchase.raffle

    let proofScreenshotID: string | undefined

    if (requiresScreenshot && req.file) {
      const uploadedScreenshot = await req.payload.create({
        collection: 'media',
        data: {
          alt: `${normalizedActionType} proof screenshot`,
        },
        file: req.file,
        req,
      })

      proofScreenshotID = uploadedScreenshot.id
    }

    const bonusActionData = {
      actionType: normalizedActionType,
      bonusEntryCount: bonusEntriesByAction[normalizedActionType],
      customer: purchaseCustomerID,
      customerEmail: purchaseEmail,
      notes: notes || undefined,
      proofScreenshot: proofScreenshotID,
      purchase: purchaseID,
      raffle: raffleID,
      socialHandle,
      status: 'pending',
    } as any

    const bonusAction = await req.payload.create({
      collection: 'raffle-bonus-actions',
      data: bonusActionData,
      req,
    })

    return Response.json({
      message: 'Bonus action submitted. It will be reviewed before extra entries are awarded.',
      bonusActionID: bonusAction.id,
    })
  },
}
