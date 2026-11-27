'use client'

import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

/**
 * Smooth scrolling (Lenis) wired into GSAP's ticker so ScrollTrigger stays in sync,
 * plus the scroll progress bar and cursor ring.
 * Mount once, inside your existing <Providers>.
 */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.1 })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // New page: back to top and re-measure every ScrollTrigger once content has mounted.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => window.clearTimeout(id)
  }, [pathname])

  return (
    <>
      <ScrollProgress />
      {children}
    </>
  )
}
