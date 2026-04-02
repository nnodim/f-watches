import { Price } from '@/components/Price'
import { BuyRaffleTicket } from '@/components/raffles/BuyRaffleTicket'
import { RaffleCountdown } from '@/components/raffles/RaffleCountdown'
import { Button } from '@/components/ui/button'
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
    title: raffle.title,
    description: raffle.description || `Buy a ticket for ${raffle.title}.`,
  }
}

export default async function RaffleDetailPage({ params }: Args) {
  const { slug } = await params
  const raffle = await queryRaffleBySlug(slug)

  if (!raffle) return notFound()

  const soldEntries = await raffleEntriesForRaffle(raffle.id)
  const remainingTickets = Math.max(raffle.maxTickets - soldEntries.length, 0)

  return (
    <div className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/60">Raffle Ticket</p>
            <h1 className="text-4xl font-semibold">{raffle.title}</h1>
            {raffle.description && (
              <p className="max-w-2xl text-base text-muted-foreground">{raffle.description}</p>
            )}
          </div>

          <RaffleCountdown drawDate={raffle.drawDate} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Ticket price</p>
              <Price amount={raffle.ticketPrice!} className="mt-2 text-3xl font-semibold" />
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Tickets sold</p>
              <p className="mt-2 text-3xl font-semibold">{soldEntries.length}</p>
            </div>
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-muted-foreground">Tickets remaining</p>
              <p className="mt-2 text-2xl font-semibold">{remainingTickets}</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">What this ticket gives you</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>Buy one ticket to enter the random draw for this raffle.</p>
              <p>
                Prize:{' '}
                {raffle.prizeType === 'free'
                  ? 'one winner receives a free watch.'
                  : 'one winner receives 50% off an eligible watch.'}
              </p>
              <p>Each purchased ticket creates one entry. More tickets means more entries.</p>
              <p>Draw date: {new Date(raffle.drawDate).toLocaleDateString()}</p>
              <p>
                Want to watch the draw happen? Visit the transparent draw page to follow the
                countdown and see the winner published.
              </p>
            </div>
            <div className="mt-5">
              <Button asChild variant="outline">
                <Link href={`/raffles/${slug}/draw`}>View Draw Page</Link>
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Buy ticket</h2>
            <div className="mt-4 text-muted-foreground">
              <BuyRaffleTicket
                drawDate={raffle.drawDate}
                remainingTickets={remainingTickets}
                raffleID={raffle.id}
                ticketPrice={raffle.ticketPrice!}
                title={raffle.title}
              />
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Sold tickets</h2>
              <span className="text-sm text-muted-foreground">{soldEntries.length} total</span>
            </div>
            <div className="mt-4 max-h-112 overflow-auto rounded-2xl border bg-primary/5 p-4">
              {soldEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tickets sold yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {soldEntries.map((entry) => (
                    <div
                      className="rounded-xl bg-background px-3 py-2 text-sm font-mono"
                      key={entry.id}
                    >
                      {entry.ticketNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
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
    where: {
      raffle: {
        equals: raffleID,
      },
    },
  })

  return result.docs
}
