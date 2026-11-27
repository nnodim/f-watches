'use client'

import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

/** A small ring that trails the mouse and grows over links/buttons. Mouse/trackpad only. */
export const CursorRing: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() =>
    motionOK(() => {
      const ring = ref.current
      if (!ring || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

      gsap.set(ring, { xPercent: -50, yPercent: -50 })
      const xTo = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' })
      const yTo = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' })
      let shown = false

      const onMove = (e: MouseEvent) => {
        xTo(e.clientX)
        yTo(e.clientY)
        if (!shown) {
          shown = true
          gsap.to(ring, { opacity: 1, duration: 0.3 })
        }
      }
      const onOver = (e: MouseEvent) => {
        const hot = (e.target as HTMLElement | null)?.closest?.('a, button, input, [role="button"]')
        gsap.to(ring, { scale: hot ? 1.9 : 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseover', onOver)
      return () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseover', onOver)
      }
    }),
  )

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-100 size-9 rounded-full border border-white opacity-0 mix-blend-difference"
    />
  )
}
