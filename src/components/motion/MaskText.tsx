'use client'

import { gsap, motionOK, SplitText, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Props = {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
  className?: string
  delay?: number
  /** Play immediately instead of waiting for scroll (use above the fold). */
  onLoad?: boolean
}

/**
 * Headline whose lines slide up out of a mask (the Omega / Awwwards reveal).
 * Re-splits on resize so line breaks stay correct. Children must be plain text.
 */
export const MaskText: React.FC<Props> = ({
  children,
  as = 'h2',
  className,
  delay = 0,
  onLoad = false,
}) => {
  const ref = useRef<HTMLElement>(null)
  const Tag = as as React.ElementType

  useGSAP(
    () =>
      motionOK(() => {
        const el = ref.current
        if (!el) return
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.25,
              ease: 'power4.out',
              stagger: 0.1,
              delay,
              scrollTrigger: onLoad ? undefined : { trigger: el, start: 'top 90%', once: true },
            })
          },
        })
      }),
    { scope: ref },
  )

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
