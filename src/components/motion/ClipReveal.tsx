'use client'

import { cn } from '@/utilities/cn'
import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Mode = 'frame' | 'left' | 'right' | 'up'

type Props = {
  children: React.ReactNode
  className?: string
  /**
   * frame: image starts as an inset frame and grows to full bleed as you scroll (scrubbed)
   * left / right / up: a wipe that plays once when it enters
   */
  mode?: Mode
}

const HIDDEN: Record<Exclude<Mode, 'frame'>, string> = {
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
  up: 'inset(100% 0% 0% 0%)',
}

export const ClipReveal: React.FC<Props> = ({ children, className, mode = 'up' }) => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        const el = ref.current
        if (!el) return

        if (mode === 'frame') {
          gsap.fromTo(
            el,
            { clipPath: 'inset(8% 5% 8% 5%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 35%', scrub: true },
            },
          )
          return
        }

        gsap.fromTo(
          el,
          { clipPath: HIDDEN[mode] },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.4,
            ease: 'power4.inOut',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          },
        )
      }),
    { scope: ref },
  )

  return (
    <div ref={ref} className={cn('relative', className)}>
      {children}
    </div>
  )
}
