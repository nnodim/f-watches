'use client'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Magnetic } from '@/components/motion/Magnetic'
import { RichText } from '@/components/RichText'
import { gsap, motionOK, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import type { Page } from '@/payload-types'
import React, { useRef } from 'react'

type SlideLink = { id?: string | null; link: React.ComponentProps<typeof CMSLink> }

type Slide = {
  id?: string | null
  image: unknown
  poster?: unknown // optional still shown before the video loads / with reduced motion
  caption?: string | null
  text?: string | null
  links?: SlideLink[] | null
}

type MediaDoc = { url?: string | null; mimeType?: string | null }

const isVideo = (m: unknown): m is MediaDoc =>
  !!m && typeof m === 'object' && !!(m as MediaDoc).mimeType?.startsWith('video/')

const posterUrl = (m: unknown) =>
  m && typeof m === 'object' ? ((m as MediaDoc).url ?? undefined) : undefined

/** Snap the page to each slide while scrolling through the hero. Set false for free scrolling. */
const SNAP = true

const buttonClass =
  'rounded-none bg-white px-10 uppercase tracking-[0.18em] text-black hover:bg-white/90'

/**
 * Layered pinning carousel (the GreenSock "layered pinning" technique):
 * every slide is a full-screen panel that pins to the top, and the next slide scrolls up
 * over it. The last slide stays pinned too, and the first section of the page scrolls up over
 * it like a curtain (wrap the page content as shown in page.tsx).
 *
 * Reads the fields your page already stores:
 *   hero.richText + hero.links   headline and buttons on the first slide
 *   hero.slides[]                { image, caption, text, links } one panel each
 *   hero.media                   fallback image if a slide has none
 *
 * Without motion (or with reduced motion) the panels simply stack as full-screen sections.
 */
export const HeroCarousel: React.FC<Page['hero']> = (hero) => {
  const { richText, links, media } = hero as Page['hero'] & { slides?: Slide[] | null }
  const slides = ((hero as { slides?: Slide[] | null }).slides ?? []) as Slide[]
  const panels: (Slide | null)[] = slides.length ? slides : [null]
  const total = panels.length
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () =>
      motionOK(() => {
        const el = root.current
        if (!el) return
        const all = (root: ParentNode, sel: string) =>
          Array.from(root.querySelectorAll<HTMLElement>(sel))

        const panelEls = all(el, '[data-panel]')
        const n = panelEls.length
        if (!n) return

        // ---------- Intro (first slide) ----------
        const first = panelEls[0]
        const zoom = first.querySelector<HTMLElement>('[data-panel-zoom]')
        const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
        if (zoom) intro.from(zoom, { scale: 1.25, duration: 2.4, ease: 'power3.out' }, 0)

        const h1 = first.querySelector<HTMLElement>('[data-hero-text] h1')
        if (h1) {
          SplitText.create(h1, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 115,
                duration: 1.3,
                stagger: 0.12,
                ease: 'power4.out',
                delay: 0.2,
              })
            },
          })
        }
        const rest = all(
          first,
          '[data-hero-text] > * > :not(h1), [data-hero-cta], [data-hero-meta]',
        )
        if (rest.length) intro.from(rest, { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, 0.8)

        const saveData = (navigator as any).connection?.saveData === true
        panelEls.forEach((panel) => {
          const video = panel.querySelector<HTMLVideoElement>('video[data-panel-video]')
          if (!video || saveData) return
          video.muted = true // some browsers ignore the muted attribute set by React
          ScrollTrigger.create({
            trigger: panel,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              if (self.isActive) video.play().catch(() => {})
              else video.pause()
            },
          })
        })

        if (n < 2) return

        // ---------- Layered pinning ----------
        panelEls.forEach((panel, i) => {
          // EVERY slide pins at the top while whatever follows scrolls up over it: the next
          // slide, or, after the last slide, the first section of the page. That last case only
          // looks right if the page content sits in an opaque layer above the hero (see page.tsx).
          ScrollTrigger.create({
            trigger: panel,
            start: 'top top',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
          })

          // As the next layer covers this slide: it dims, the picture pushes in, the text fades.
          const cover = { trigger: panel, start: 'top top', end: 'bottom top', scrub: true }
          const shade = panel.querySelector<HTMLElement>('[data-panel-shade]')
          const bg = panel.querySelector<HTMLElement>('[data-panel-bg]')
          const content = panel.querySelector<HTMLElement>('[data-panel-content]')
          if (shade) gsap.to(shade, { opacity: 0.75, ease: 'none', scrollTrigger: cover })
          if (bg) gsap.to(bg, { scale: 1.12, ease: 'none', scrollTrigger: cover })
          if (content) {
            gsap.to(content, {
              opacity: 0,
              y: -40,
              ease: 'none',
              scrollTrigger: { ...cover, end: 'center top' },
            })
          }

          // Slides after the first reveal their text as they arrive (and un-reveal when leaving).
          if (i > 0) {
            if (content?.children.length) {
              gsap.from(Array.from(content.children), {
                opacity: 0,
                y: 50,
                duration: 1,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: panel,
                  start: 'top 60%',
                  toggleActions: 'play none none reverse',
                },
              })
            }
          }
        })

        // ---------- Snap to each slide, only while inside the hero ----------
        // Range ends at the last slide's top, so scrolling on past it is never snapped back.
        if (SNAP) {
          ScrollTrigger.create({
            trigger: el,
            start: 'top top',
            end: () => '+=' + (n - 1) * panelEls[0].offsetHeight,
            snap: {
              snapTo: 1 / (n - 1),
              duration: { min: 0.25, max: 0.7 },
              delay: 0.05,
              ease: 'power2.inOut',
            },
            invalidateOnRefresh: true,
          })
        }
      }),
    { scope: root },
  )

  const pad = (v: number) => String(v).padStart(2, '0')

  return (
    // No overflow-hidden here: it would break the pinning.
    // `isolate` keeps the slides' z-index values inside the hero, so the page content that follows
    // (given `relative z-10` in page.tsx) always paints above every slide.
    <section ref={root} className="relative isolate -mt-px bg-neutral-950 text-white">
      {panels.map((slide, i) => {
        const isFirst = i === 0
        const image: unknown = slide?.image ?? media
        const slideLinks = (slide?.links ?? []) as SlideLink[]

        return (
          <div
            key={slide?.id ?? i}
            data-panel
            // Explicit stacking order so each later slide paints over the pinned one before it.
            style={{ zIndex: i + 1 }}
            className="relative flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden bg-neutral-950"
          >
            {/* Background */}
            <div data-panel-bg aria-hidden className="absolute inset-0">
              <div data-panel-zoom className="absolute inset-0">
                {isVideo(image) ? (
                  <video
                    data-panel-video
                    src={image.url ?? undefined}
                    poster={posterUrl(slide?.poster)}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                    preload={isFirst ? 'auto' : 'metadata'}
                    disablePictureInPicture
                    aria-hidden
                  />
                ) : image ? (
                  <Media
                    fill
                    priority={isFirst}
                    resource={image as never}
                    imgClassName="object-cover"
                  />
                ) : null}
              </div>
            </div>
            <div data-panel-shade aria-hidden className="absolute inset-0 bg-black opacity-30" />

            {/* Centre content */}
            <div
              data-panel-content
              className="container relative z-10 flex flex-col items-center pb-28 pt-24 text-center"
            >
              {isFirst ? (
                <>
                  <div
                    data-hero-text
                    className="mx-auto max-w-3xl [&_h1]:text-5xl [&_h1]:font-light [&_h1]:leading-[1.05] [&_h1]:tracking-tight [&_h1]:text-white md:[&_h1]:text-7xl [&_p]:text-white/85"
                  >
                    {richText && (
                      <RichText data={richText} enableGutter={false} enableProse={false} />
                    )}
                  </div>
                  {Array.isArray(links) && links.length > 0 && (
                    <ul data-hero-cta className="mt-10 flex flex-wrap justify-center gap-4">
                      {links.map(({ link }, k) => (
                        <li key={k}>
                          <Magnetic>
                            <CMSLink
                              {...link}
                              appearance="default"
                              size="lg"
                              className={buttonClass}
                            />
                          </Magnetic>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  {slide?.caption && (
                    <h2 className="max-w-3xl text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
                      {slide.caption}
                    </h2>
                  )}
                  {slide?.text && (
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
                      {slide.text}
                    </p>
                  )}
                  {slideLinks.length > 0 && (
                    <ul className="mt-10 flex flex-wrap justify-center gap-4">
                      {slideLinks.map(({ link }, k) => (
                        <li key={k}>
                          <Magnetic>
                            <CMSLink
                              {...link}
                              appearance="default"
                              size="lg"
                              className={buttonClass}
                            />
                          </Magnetic>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* Bottom bar: first slide's caption, scroll cue, counter */}
            <div className="container absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-8 pb-8">
              <div data-hero-meta={isFirst ? '' : undefined} className="max-w-xs text-left">
                {isFirst && slide?.caption && (
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    {slide.caption}
                  </p>
                )}
                {isFirst && slide?.text && (
                  <p className="mt-2 text-sm leading-relaxed text-white/90">{slide.text}</p>
                )}
              </div>
              <span className="font-mono text-xs tracking-[0.3em] text-white/70">
                {pad(i + 1)} / {pad(total)}
              </span>
            </div>

            {isFirst && total > 1 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-8 z-10 hidden justify-center md:flex"
              >
                <span className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/70">
                  Scroll
                  <span className="block h-8 w-px animate-pulse bg-white/60" />
                </span>
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
