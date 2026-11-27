'use client'

import { cn } from '@/utilities/cn'
import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  strength?: number
}

/** Pulls a button/link toward the cursor, then springs back. Mouse only. */
export const Magnetic: React.FC<Props> = ({ children, className, strength = 0.3 }) => {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        const el = ref.current
        if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect()
          gsap.to(el, {
            x: (e.clientX - (r.left + r.width / 2)) * strength,
            y: (e.clientY - (r.top + r.height / 2)) * strength * 1.3,
            duration: 0.4,
            ease: 'power3.out',
          })
        }
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })

        el.addEventListener('mousemove', move)
        el.addEventListener('mouseleave', leave)
        return () => {
          el.removeEventListener('mousemove', move)
          el.removeEventListener('mouseleave', leave)
        }
      }),
    { scope: ref },
  )

  return (
    <span ref={ref} className={cn('inline-block', className)}>
      {children}
    </span>
  )
}
