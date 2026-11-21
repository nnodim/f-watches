'use client'

import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import React, { useRef } from 'react'
import { Logo } from '../Logo/Logo'

type Props = {
  className?: string
  delay?: number
  onLoad?: boolean
}

export const MaskLogo: React.FC<Props> = ({ className, delay = 0, onLoad = false }) => {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        const wrapper = ref.current
        const img = wrapper?.querySelector('img')

        if (!wrapper || !img) return

        gsap.from(img, {
          yPercent: 115,
          duration: 1.25,
          ease: 'power4.out',
          delay,
          scrollTrigger: onLoad
            ? undefined
            : {
                trigger: wrapper,
                start: 'top 90%',
                once: true,
              },
        })
      }),
    { scope: ref },
  )

  return (
    <div ref={ref} aria-hidden="true" className="overflow-hidden">
      <Logo loading="eager" priority="high" className={className} />
    </div>
  )
}
