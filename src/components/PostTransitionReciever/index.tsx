'use client'

import { useEffect } from 'react'
import { gsap } from '@/lib/gsap'

export function PostTransitionReceiver() {
  useEffect(() => {
    const layer = document.querySelector<HTMLElement>('[data-post-transition]')
    if (!layer) return

    const backdrop = layer.children[0] as HTMLElement
    const frame = layer.children[1] as HTMLElement
    const title = frame.querySelector('[data-title]')

    const t = window.setTimeout(() => {
      const hero = document.querySelector<HTMLElement>('[data-post-hero]')
      const r = hero?.getBoundingClientRect()

      const tl = gsap.timeline({ onComplete: () => layer.remove() })
      tl.to(title, { opacity: 0, duration: 0.25 }, 0).to(
        backdrop,
        { opacity: 0, duration: 0.5, ease: 'power1.inOut' },
        0.1,
      )

      if (r) {
        tl.to(
          frame,
          {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            duration: 0.8,
            ease: 'expo.inOut',
          },
          0,
        )
      }
      tl.to(frame, { opacity: 0, duration: 0.3 }, r ? '>-0.15' : '>')
    }, 250) // let the new page and hero image paint first

    return () => window.clearTimeout(t)
  }, [])

  return null
}
