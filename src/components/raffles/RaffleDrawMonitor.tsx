'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const getTimeRemaining = (drawDate: string) => {
  const difference = new Date(drawDate).getTime() - Date.now()

  if (difference <= 0) {
    return null
  }

  const totalSeconds = Math.floor(difference / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

type Props = {
  drawDate: string
  isDrawn: boolean
}

export function RaffleDrawMonitor({ drawDate, isDrawn }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [isRunningCron, setIsRunningCron] = useState(false)
  const [remaining, setRemaining] = useState(() => getTimeRemaining(drawDate))

  const isAdmin = Boolean(user?.roles?.includes('admin'))
  const hasReachedDrawTime = !remaining

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(getTimeRemaining(drawDate))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [drawDate])

  useEffect(() => {
    if (isDrawn) return

    const refreshInterval = window.setInterval(() => {
      const drawTimeReached = new Date(drawDate).getTime() <= Date.now()

      if (drawTimeReached) {
        router.refresh()
      }
    }, 10000)

    return () => window.clearInterval(refreshInterval)
  }, [drawDate, isDrawn, router])

  const statusLabel = useMemo(() => {
    if (isDrawn) return 'Winner selected'
    if (hasReachedDrawTime) return 'Selection in progress'
    return 'Awaiting draw time'
  }, [hasReachedDrawTime, isDrawn])

  const runScheduledDrawCheck = async () => {
    setIsRunningCron(true)

    try {
      const response = await fetch('/api/raffles/run-due-draws', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to run scheduled draw check.')
      }

      const processedCount = Array.isArray(data?.results) ? data.results.length : 0
      toast.success(
        processedCount > 0
          ? `Scheduled draw check ran for ${processedCount} raffle${processedCount === 1 ? '' : 's'}.`
          : 'Scheduled draw check ran successfully.',
      )
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to run scheduled draw check.')
    } finally {
      setIsRunningCron(false)
    }
  }

  return (
    <div className="rounded-3xl border bg-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-primary/60">Live Draw Monitor</p>
          <h2 className="text-2xl font-semibold">{statusLabel}</h2>
          <p className="text-sm text-muted-foreground">
            This page refreshes automatically around draw time so viewers can see when the winner is
            selected.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-col items-start gap-2">
            <Button disabled={isRunningCron} onClick={runScheduledDrawCheck} variant="outline">
              {isRunningCron ? 'Running draw check...' : 'Run Scheduled Draw Check'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Admin test control for the same endpoint the cron job calls.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/60">Countdown</p>
        {remaining ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Days', value: remaining.days },
              { label: 'Hours', value: remaining.hours },
              { label: 'Minutes', value: remaining.minutes },
              { label: 'Seconds', value: remaining.seconds },
            ].map((cell) => (
              <div className="rounded-xl bg-background p-4 text-center" key={cell.label}>
                <p className="text-3xl font-semibold">{String(cell.value).padStart(2, '0')}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {cell.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-background p-4">
            <p className="text-xl font-semibold">
              {isDrawn ? 'The winner has been selected.' : 'Draw time has arrived.'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDrawn
                ? 'The winning ticket is now locked in and shown below.'
                : 'The system is checking due raffles and will publish the winner here once selection completes.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
