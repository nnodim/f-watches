import { Price } from '@/components/Price'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

export default async function RafflesPage() {
  const payload = await getPayload({ config: configPromise })
  const raffles = await payload.find({
    collection: 'raffles',
    depth: 1,
    limit: 12,
    pagination: false,
    where: {
      status: {
        in: ['scheduled', 'open'],
      },
    },
  })

  return (
    <div className="container py-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-primary/60">Raffles</p>
        <h1 className="text-4xl font-semibold">Buy a ticket for a chance to win your next watch.</h1>
        <p className="text-base text-muted-foreground">
          Each raffle has its own ticket price, draw date, and prize. Buy tickets directly from the
          raffle page and your entry is created automatically once payment succeeds.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {raffles.docs.map((raffle) => (
          <article className="rounded-3xl border border-border bg-card p-6" key={raffle.id}>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60">
                  Draws {new Date(raffle.drawDate).toLocaleDateString()}
                </p>
                <h2 className="text-2xl font-semibold">{raffle.title}</h2>
                {raffle.description && (
                  <p className="text-sm text-muted-foreground">{raffle.description}</p>
                )}
              </div>

              <div className="rounded-2xl bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Ticket price</p>
                <Price amount={raffle.ticketPrice ?? 0} className="text-2xl font-semibold" />
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{raffle.maxTickets} tickets available for this draw.</p>
                <p>Prize: {raffle.prizeType === 'free' ? 'free watch' : '50% off a watch'}.</p>
              </div>

              {raffle.slug ? (
                <Link
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  href={`/raffles/${raffle.slug}`}
                >
                  View Raffle
                </Link>
              ) : (
                <span className="inline-flex h-9 w-full items-center justify-center rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
                  Raffle unavailable
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
