'use client'

import { cn } from '@/utilities/cn'
import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** Travel in % of the image height, each direction. Keep below 9 (image is scaled 1.18). */
  amount?: number
}

/**
 * Clips its child and drifts it slower than the page. Put <Media fill /> inside.
 * The wrapper is `relative overflow-hidden`; pass `absolute inset-0` to fill a parent.
 */
export const Parallax: React.FC<Props> = ({ children, className, amount = 8 }) => {
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        gsap.set(inner.current, { scale: 1.18 })
        gsap.fromTo(
          inner.current,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
      }),
    { scope: wrap },
  )

  return (
    <div ref={wrap} className={cn('relative overflow-hidden', className)}>
      <div ref={inner} className="absolute inset-0 will-change-transform">
        {children}
      </div>
    </div>
  )
}
