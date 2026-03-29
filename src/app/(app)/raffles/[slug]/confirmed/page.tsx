import { BonusActionForm } from '@/components/raffles/BonusActionForm'
import { Button } from '@/components/ui/button'
import { socialCampaignConfig } from '@/lib/constants'
// import { buildInstagramProfileDeepLink } from '@/utilities/socialLinks'
import Link from 'next/link'
import configPromise from '@payload-config'
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
  const bonusActions = purchaseID ? await queryBonusActionsByPurchase(purchaseID) : []
  // const instagramDeepLink = buildInstagramProfileDeepLink(socialCampaignConfig.instagramUsername)

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl rounded-4xl border bg-card p-8 md:p-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/60">Ticket Confirmed</p>
            <h1 className="text-4xl font-semibold">Your ticket is confirmed</h1>
            <p className="text-base text-muted-foreground">
              Want to increase your chances? Complete these steps:
            </p>
          </div>

          <div className="rounded-3xl bg-primary/5 p-6">
            <div className="space-y-4 text-muted-foreground">
              <div className="rounded-2xl bg-background p-4">
                <p>1. Follow our Instagram page.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  {/* <Button asChild>
                    <a href={instagramDeepLink}>Open Instagram App</a>
                  </Button> */}
                  <Button asChild variant="outline">
                    <a
                      href={socialCampaignConfig.instagramProfileURL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Instagram
                    </a>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p>2. Repost the official raffle campaign ad.</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  {/* <Button asChild>
                    <a href={instagramDeepLink}>Open Instagram App</a>
                  </Button> */}
                  <Button asChild variant="outline">
                    <a
                      href={socialCampaignConfig.instagramProfileURL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open Instagram
                    </a>
                  </Button>
                </div>
              </div>
              <p>3. Tag your friends under the campaign post.</p>
              <p>4. Keep your repost live until the draw date.</p>
            </div>
          </div>

          <div className="rounded-3xl border p-6">
            <h2 className="text-2xl font-semibold">Mark your bonus activities</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your Instagram handle once, then tick each activity as you complete it. Checked
              items move to pending review. Unticked items stay not submitted.
            </p>
            <div className="mt-6">
              <BonusActionForm existingActions={bonusActions} purchaseID={purchaseID} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href={`/raffles/${slug}`}>Back to Raffle</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/raffles">View More Raffles</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const queryBonusActionsByPurchase = async (purchaseID: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffle-bonus-actions',
    depth: 0,
    limit: 50,
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
