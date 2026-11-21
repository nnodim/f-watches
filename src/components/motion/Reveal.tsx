'use client'

import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** Distance in px the element travels up while fading in. */
  y?: number
  delay?: number
}

/** Fade + rise when scrolled into view. */
export const Reveal: React.FC<Props> = ({ children, className, y = 40, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        gsap.from(ref.current, {
          opacity: 0,
          y,
          delay,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        })
      }),
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
