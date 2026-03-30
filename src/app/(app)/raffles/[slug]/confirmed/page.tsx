import { RaffleConfirmedContent } from '@/components/raffles/RaffleConfirmedContent'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    purchase?: string
  }>
}

export default async function RaffleConfirmedPage({ params, searchParams }: Args) {
  const { slug } = await params
  const { purchase: purchaseID } = await searchParams
  if (!purchaseID) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 text-center md:p-10">
          <h1 className="text-2xl font-semibold">Check your email for your raffle progress link</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We send a confirmation email after ticket purchase with a direct link back to your
            bonus activity page.
          </p>
        </div>
      </div>
    )
  }

  const purchase = await queryPurchaseByID(purchaseID)

  if (purchase?.confirmationToken) {
    redirect(`/raffles/${slug}/confirmed/${purchase.confirmationToken}`)
  }

  const bonusActions = await queryBonusActionsByPurchase(purchaseID)
  const ticketNumbers = await queryTicketNumbersByPurchase(purchaseID)

  return (
    <RaffleConfirmedContent
      bonusActions={bonusActions}
      purchaseID={purchaseID}
      slug={slug}
      ticketNumbers={ticketNumbers}
    />
  )
}

const queryPurchaseByID = async (purchaseID: string) => {
  const payload = await getPayload({ config: configPromise })

  return payload.findByID({
    collection: 'raffle-purchases',
    id: purchaseID,
    depth: 0,
    overrideAccess: true,
    select: {
      confirmationToken: true,
      id: true,
    },
  })
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

const queryTicketNumbersByPurchase = async (purchaseID: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffle-entries',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'ticketNumber',
    where: {
      purchase: {
        equals: purchaseID,
      },
    },
  })

  return result.docs.map((doc) => doc.ticketNumber).filter((value): value is string => Boolean(value))
}
