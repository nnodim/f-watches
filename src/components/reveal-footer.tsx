'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  footer: React.ReactNode
  /** Routes that get the reveal. Defaults to the home page only. */
  revealOn?: string[]
}

export function FooterReveal({ children, footer, revealOn = ['/'] }: Props) {
  const pathname = usePathname()
  const enabled = revealOn.includes(pathname)

  const pageRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const [height, setHeight] = useState(0)
  const [fits, setFits] = useState(true)
  const canReveal = enabled && fits

  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const measure = () => {
      const h = el.offsetHeight
      setHeight(h)
      setFits(h <= window.innerHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

//   useGSAP(
//     () => {
//       if (!canReveal || !height) return
//       return motionOK(() => {
//         const page = pageRef.current
//         const inner = innerRef.current
//         if (!page || !inner) return

//         gsap.fromTo(
//           inner,
//           { yPercent: -30, scale: 0.96, opacity: 0.4, transformOrigin: '50% 100%' },
//           {
//             yPercent: 0,
//             scale: 1,
//             opacity: 1,
//             ease: 'none',
//             scrollTrigger: {
//               trigger: page,
//               start: 'bottom bottom',
//               end: () => `bottom bottom-=${footerRef.current?.offsetHeight ?? 0}`,
//               scrub: true,
//               invalidateOnRefresh: true,
//             },
//           },
//         )
//       })
//     },
//     { dependencies: [canReveal, height, pathname], scope: pageRef },
//   )

//   // Re-measure scroll positions when switching between reveal / normal pages
//   useEffect(() => {
//     ScrollTrigger.refresh()
//   }, [height, canReveal, pathname])

  return (
    <>
      <div
        ref={pageRef}
        className={canReveal ? 'relative z-10 min-h-svh bg-background' : 'relative'}
        style={canReveal ? { marginBottom: height } : undefined}
      >
        {children}
      </div>

      <div
        ref={footerRef}
        className={canReveal ? 'fixed inset-x-0 bottom-0 z-0 bg-background' : 'relative'}
      >
        <div ref={innerRef} className={canReveal ? 'will-change-transform' : undefined}>
          {footer}
        </div>
      </div>
    </>
  )
}
