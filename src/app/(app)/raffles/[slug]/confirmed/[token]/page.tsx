import { RaffleConfirmedContent } from '@/components/raffles/RaffleConfirmedContent'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type Args = {
  params: Promise<{
    slug: string
    token: string
  }>
}

export default async function RaffleConfirmedTokenPage({ params }: Args) {
  const { slug, token } = await params
  const purchase = await queryPurchaseByToken(slug, token)

  if (!purchase) {
    notFound()
  }

  const bonusActions = await queryBonusActionsByPurchase(purchase.id)

  return (
    <RaffleConfirmedContent bonusActions={bonusActions} purchaseID={purchase.id} slug={slug} />
  )
}

const queryPurchaseByToken = async (slug: string, token: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffle-purchases',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    select: {
      confirmationToken: true,
      id: true,
      raffle: true,
      status: true,
    },
    where: {
      and: [
        {
          confirmationToken: {
            equals: token,
          },
        },
        {
          status: {
            equals: 'paid',
          },
        },
      ],
    },
  })

  const purchase = result.docs[0]

  if (!purchase) {
    return null
  }

  const raffleSlug =
    purchase.raffle && typeof purchase.raffle === 'object' && 'slug' in purchase.raffle
      ? purchase.raffle.slug
      : null

  if (raffleSlug !== slug) {
    return null
  }

  return purchase
}

const queryBonusActionsByPurchase = async (purchaseID: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffle-bonus-actions',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    pagination: false,
    where: {
      purchase: {
        equals: purchaseID,
      },
    },
  })

  return result.docs.map((doc) => ({
    actionType: doc.actionType,
    id: doc.id,
    socialHandle: doc.socialHandle,
    status: doc.status,
  }))
}
