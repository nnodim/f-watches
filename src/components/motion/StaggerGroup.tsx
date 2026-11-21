'use client'

import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  stagger?: number
}

/**
 * Wrap any grid/list: its direct children rise in one after another on scroll.
 * Use it around your Archive (products / posts) grid.
 */
export const StaggerGroup: React.FC<Props> = ({ children, className, stagger = 0.1 }) => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        const el = ref.current
        if (!el || !el.children.length) return
        // Wrapping a single grid/list? Animate its items rather than the wrapper.
        const only = el.children[0]
        const targets =
          el.children.length === 1 && only.children.length > 1 ? only.children : el.children
        gsap.from(targets, {
          opacity: 0,
          y: 60,
          stagger,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
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
