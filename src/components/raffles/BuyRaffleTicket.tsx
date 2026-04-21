'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import posthog from 'posthog-js'

export function BuyRaffleTicket(props: {
  drawDate: string
  remainingTickets: number
  raffleID: string
  ticketPrice: number
  title: string
}) {
  const { drawDate, raffleID, remainingTickets, ticketPrice, title } = props
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState(user?.email || '')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const salesClosed = new Date(drawDate) <= new Date() || remainingTickets <= 0

  const startPayment = async () => {
    if (!user?.email && !email.trim()) {
      toast.error('Enter your email address to continue.')
      return
    }

    setIsLoading(true)

    posthog.capture('raffle_ticket_purchase_started', {
      raffle_id: raffleID,
      raffle_title: title,
      quantity,
      total_price: ticketPrice * quantity,
    })

    try {
      const response = await fetch(`/api/raffles/${raffleID}/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: user?.email || email.trim(),
          quantity,
        }),
      })

      const paymentData = await response.json()

      if (!response.ok) {
        throw new Error(paymentData?.message || 'Unable to start payment.')
      }

      const PaystackPop = (await import('@paystack/inline-js')).default
      const popup = new PaystackPop()

      popup.resumeTransaction(paymentData.accessCode, {
        async onSuccess(tranx) {
          try {
            const confirmResponse = await fetch('/api/raffles/confirm-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentReference: tranx.reference,
              }),
            })

            const confirmData = await confirmResponse.json()

            if (!confirmResponse.ok) {
              throw new Error(confirmData?.message || 'Unable to confirm payment.')
            }

            posthog.capture('raffle_ticket_purchased', {
              raffle_id: raffleID,
              raffle_title: title,
              quantity,
              total_price: ticketPrice * quantity,
              payment_reference: tranx.reference,
            })
            toast.success(`You have successfully entered ${title}.`)
            if (
              confirmData?.raffleSlug &&
              typeof confirmData.raffleSlug === 'string' &&
              confirmData?.confirmationToken &&
              typeof confirmData.confirmationToken === 'string'
            ) {
              router.push(`/raffles/${confirmData.raffleSlug}/confirmed/${confirmData.confirmationToken}`)
            } else {
              router.refresh()
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Payment confirmation failed.')
          } finally {
            setIsLoading(false)
          }
        },
        onCancel() {
          posthog.capture('raffle_ticket_purchase_cancelled', {
            raffle_id: raffleID,
            raffle_title: title,
          })
          setIsLoading(false)
          toast.info('Payment was cancelled.')
        },
      })
    } catch (error) {
      setIsLoading(false)
      toast.error(error instanceof Error ? error.message : 'Unable to start payment.')
    }
  }

  return (
    <div className="space-y-4">
      {!user?.email && (
        <div className="space-y-2">
          <Label htmlFor="raffle-email">Email</Label>
          <Input
            id="raffle-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="raffle-quantity">Number of tickets</Label>
        <Input
          id="raffle-quantity"
          min={1}
          max={Math.max(remainingTickets, 1)}
          onChange={(event) =>
            setQuantity(
              Math.min(
                Math.max(Number.parseInt(event.target.value || '1', 10), 1),
                Math.max(remainingTickets, 1),
              ),
            )
          }
          type="number"
          value={quantity}
        />
      </div>

      <div className="rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
        Total:{' '}
        <span className="font-semibold text-foreground">
          NGN {((ticketPrice / 100) * quantity).toLocaleString()}
        </span>
      </div>

      <Button className="w-full" disabled={salesClosed || isLoading} onClick={startPayment}>
        {salesClosed
          ? remainingTickets <= 0
            ? 'Sold out'
            : 'Ticket sales closed'
          : isLoading
            ? 'Processing...'
            : 'Buy Ticket'}
      </Button>
    </div>
  )
}
