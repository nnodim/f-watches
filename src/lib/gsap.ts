import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
}

/**
 * Runs `setup` only when the visitor has NOT asked for reduced motion.
 * Use inside useGSAP and return the result:
 *
 *   useGSAP(() => motionOK(() => { ...tweens... }), { scope: ref })
 *
 * With reduced motion on, nothing is animated and all content simply shows.
 */
export function motionOK(setup: () => void | (() => void)) {
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', setup)
  return () => mm.revert()
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
