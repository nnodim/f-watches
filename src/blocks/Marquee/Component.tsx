'use client'

import { gsap, motionOK, ScrollTrigger, useGSAP } from '@/lib/gsap'
import type { MarqueeBlock as Props } from '@/payload-types'
import React, { useRef } from 'react'

export const MarqueeBlock: React.FC<Props> = ({ words, duration }) => {
  const root = useRef<HTMLElement>(null)
  const list = words ?? []

  useGSAP(
    () =>
      motionOK(() => {
        const groups = root.current?.querySelectorAll('[data-group]')
        if (!groups?.length) return

        // Constant drift. Scrolling speeds it up and flips its direction.
        const drift = gsap.to(groups, {
          xPercent: -100,
          repeat: -1,
          ease: 'none',
          duration: duration ?? 40,
        })

        ScrollTrigger.create({
          onUpdate(self) {
            const dir = self.direction || 1
            const boost = Math.min(8, 1 + Math.abs(self.getVelocity()) / 260)
            gsap.fromTo(
              drift,
              { timeScale: dir * boost },
              { timeScale: dir, duration: 1.2, ease: 'power3.out', overwrite: true },
            )
          },
        })
      }),
    { scope: root },
  )

  if (!list.length) return null

  // Each group repeats the words so it is always wider than the screen.
  const group = (hidden: boolean) => (
    <div
      data-group
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-14 pr-14"
    >
      {[...list, ...list].map((w, i) => (
        <div key={i} className="flex items-center gap-14">
          <span className="text-6xl font-light tracking-tight md:text-8xl">{w.text}</span>
          <span aria-hidden className="size-3 rotate-45 bg-primary" />
        </div>
      ))}
    </div>
  )

  return (
    <section
      ref={root}
      className="overflow-hidden border-y border-neutral-200 py-8 dark:border-neutral-700 md:py-10"
    >
      <div className="flex w-max whitespace-nowrap">
        {group(false)}
        {group(true)}
      </div>
    </section>
  )
}
