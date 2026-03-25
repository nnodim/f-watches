'use client'

import { useEffect, useState } from 'react'

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

export function RaffleCountdown({ drawDate }: { drawDate: string }) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(drawDate))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(getTimeRemaining(drawDate))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [drawDate])

  if (!remaining) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-primary/60">Countdown</p>
        <p className="mt-2 text-2xl font-semibold">Draw day is here.</p>
      </div>
    )
  }

  const cells = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Minutes', value: remaining.minutes },
    { label: 'Seconds', value: remaining.seconds },
  ]

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-primary/60">Countdown</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cells.map((cell) => (
          <div className="rounded-xl bg-background p-4 text-center" key={cell.label}>
            <p className="text-3xl font-semibold">{String(cell.value).padStart(2, '0')}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {cell.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
