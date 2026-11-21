'use client'

import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

export const ScrollProgress: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() =>
    motionOK(() => {
      gsap.to(ref.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      })
    }),
  )

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.75 origin-left scale-x-0 bg-primary"
    />
  )
}
