import { BonusActionForm } from '@/components/raffles/BonusActionForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type BonusAction = {
  actionType: string
  id: string
  socialHandle?: null | string
  status: string
}

export function RaffleConfirmedContent(props: {
  bonusActions: BonusAction[]
  purchaseID?: string
  slug: string
  ticketNumbers?: string[]
}) {
  const { bonusActions, purchaseID, slug, ticketNumbers = [] } = props

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-4 md:rounded-4xl md:p-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60 lg:text-sm">
              Ticket Confirmed
            </p>
            <h1 className="text-2xl font-semibold lg:text-4xl">Your ticket is confirmed</h1>
            <p className="text-sm text-muted-foreground lg:text-base">
              Want to increase your chances? Complete these steps:
            </p>
          </div>

          <div>
            {ticketNumbers.length > 0 && (
              <div className="rounded-2xl border bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/60">Your Tickets</p>
                <p className="mt-2 text-sm font-medium text-foreground lg:text-base">
                  {ticketNumbers.join(', ')}
                </p>
              </div>
            )}

            <p className="mt-2 text-xs text-muted-foreground lg:text-sm">
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
          </div>
        </div>
      </div>
    </div>
  )
}
