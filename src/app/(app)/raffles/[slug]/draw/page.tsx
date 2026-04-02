import { Button } from '@/components/ui/button'
import { RaffleDrawMonitor } from '@/components/raffles/RaffleDrawMonitor'
import { Price } from '@/components/Price'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const raffle = await queryRaffleBySlug(slug)

  if (!raffle) return notFound()

  return {
    title: `${raffle.title} Draw`,
    description: `Watch the transparent live draw for ${raffle.title}.`,
  }
}

export default async function RaffleDrawPage({ params }: Args) {
  const { slug } = await params
  const raffle = await queryRaffleBySlug(slug)

  if (!raffle) return notFound()

  const entries = await raffleEntriesForRaffle(raffle.id)
  const winnerEntryID =
    raffle.winnerEntry && typeof raffle.winnerEntry === 'object' ? raffle.winnerEntry.id : null
  const winnerEntry = winnerEntryID ? entries.find((entry) => entry.id === winnerEntryID) : null
  const winnerIdentity = winnerEntry ? await queryWinnerIdentity(winnerEntry.id) : null

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/60">Draw</p>
            <h1 className="text-4xl font-semibold">{raffle.title}</h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Everyone can follow this page as the raffle countdown ends and the winner is selected
              from the active ticket pool shown below.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Prize</p>
              <p className="mt-2 text-xl font-semibold">
                {raffle.prizeType === 'free' ? 'Free watch' : '50% off watch'}
              </p>
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Ticket price</p>
              <Price amount={raffle.ticketPrice || 0} className="mt-2 text-3xl font-semibold" />
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Eligible tickets</p>
              <p className="mt-2 text-3xl font-semibold">{entries.length}</p>
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="mt-2 text-2xl font-semibold capitalize">{raffle.status}</p>
            </div>
          </div>
        </section>

        <RaffleDrawMonitor drawDate={raffle.drawDate} isDrawn={raffle.status === 'drawn'} />

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-6">
              <h2 className="text-2xl font-semibold">How the winner is selected</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>1. Every purchased ticket becomes one active raffle entry.</p>
                <p>2. When the draw time arrives, the system checks all due raffles.</p>
                <p>3. It collects the active ticket pool shown on this page.</p>
                <p>4. One ticket is randomly selected from that pool.</p>
                <p>5. The winning ticket is published here and the buyer is emailed automatically.</p>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-6">
              <h2 className="text-2xl font-semibold">Prize Watch{raffle.eligibleProducts?.length === 1 ? '' : 'es'}</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>
                  Winner reward:{' '}
                  {raffle.prizeType === 'free'
                    ? 'one free watch from the eligible selection below.'
                    : '50% off one watch from the eligible selection below.'}
                </p>
                {raffle.rewardCodeExpiresAt && (
                  <p>
                    Redemption deadline:{' '}
                    {new Date(raffle.rewardCodeExpiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-3">
                {(raffle.eligibleProducts || []).map((product, index) => {
                  const productTitle =
                    product && typeof product === 'object' && 'title' in product ? product.title : null
                  const productSlug =
                    product && typeof product === 'object' && 'slug' in product ? product.slug : null

                  return (
                    <div className="rounded-2xl border p-4" key={productSlug || index}>
                      <p className="font-medium">{productTitle || 'Eligible watch'}</p>
                      {productSlug ? (
                        <Link
                          className="mt-1 inline-block text-sm text-primary underline-offset-4 hover:underline"
                          href={`/products/${productSlug}`}
                        >
                          View watch
                        </Link>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-6">
              <h2 className="text-2xl font-semibold">Winner status</h2>
              {winnerEntry ? (
                <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-primary/60">
                    Winning Ticket
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{winnerEntry.ticketNumber}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected on{' '}
                    {winnerEntry.drawnAt ? new Date(winnerEntry.drawnAt).toLocaleString() : 'draw day'}
                    .
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Reward applies to{' '}
                    {(raffle.eligibleProducts || [])
                      .map((product) =>
                        product && typeof product === 'object' && 'title' in product
                          ? product.title
                          : null,
                      )
                      .filter(Boolean)
                      .join(', ') || 'the eligible raffle watch selection'}
                    .
                  </p>
                  {winnerIdentity?.customerEmail ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Winner email: <span className="font-medium text-foreground">{winnerIdentity.customerEmail}</span>
                    </p>
                  ) : null}
                  {winnerIdentity?.socialHandle ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Winner username:{' '}
                      <span className="font-medium text-foreground">{winnerIdentity.socialHandle}</span>
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    No winner has been published yet. Once the draw completes, the winning ticket
                    will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={`/raffles/${slug}`}>Back to Raffle</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Active Ticket Pool</h2>
              <span className="text-sm text-muted-foreground">{entries.length} tickets</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This is the pool of ticket numbers eligible for the random selection.
            </p>
            <div className="mt-4 max-h-[40rem] overflow-auto rounded-2xl border bg-primary/5 p-4">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No eligible tickets yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {entries.map((entry) => {
                    const isWinner = winnerEntry?.id === entry.id

                    return (
                      <div
                        className={`rounded-xl px-3 py-2 text-sm font-mono ${
                          isWinner
                            ? 'border border-primary/40 bg-primary text-primary-foreground'
                            : 'bg-background'
                        }`}
                        key={entry.id}
                      >
                        {entry.ticketNumber}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const queryRaffleBySlug = async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffles',
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0] || null
}

const raffleEntriesForRaffle = async (raffleID: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'raffle-entries',
    depth: 0,
    limit: 5000,
    pagination: false,
    sort: 'ticketNumber',
    where: {
      and: [
        {
          raffle: {
            equals: raffleID,
          },
        },
        {
          status: {
            in: ['active', 'winner'],
          },
        },
      ],
    },
  })

  return result.docs
}

const queryWinnerIdentity = async (entryID: string) => {
  const payload = await getPayload({ config: configPromise })
  const entry = await payload.findByID({
    collection: 'raffle-entries',
    id: entryID,
    depth: 0,
    overrideAccess: true,
    select: {
      customerEmail: true,
      purchase: true,
    },
  })

  const purchaseID =
    entry.purchase && typeof entry.purchase === 'object' ? entry.purchase.id : entry.purchase

  let socialHandle: null | string = null

  if (purchaseID) {
    const bonusActions = await payload.find({
      collection: 'raffle-bonus-actions',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: {
        and: [
          {
            purchase: {
              equals: purchaseID,
            },
          },
          {
            socialHandle: {
              exists: true,
            },
          },
        ],
      },
    })

    socialHandle = bonusActions.docs[0]?.socialHandle || null
  }

  return {
    customerEmail: entry.customerEmail || null,
    socialHandle,
  }
}
