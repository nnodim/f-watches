'use client'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { gsap, motionOK, useGSAP } from '@/lib/gsap'
import Link from 'next/link'
import React, { useMemo, useRef } from 'react'
import type { MenuBrand, NavItem } from './types'

type Props = {
  item: NavItem
  brands: MenuBrand[]
  onNavigate: () => void
}

export function MegaPanel({ item, brands, onNavigate }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // group brands by first letter
  const groups = useMemo(() => {
    const map = new Map<string, MenuBrand[]>()
    for (const b of brands) {
      const k = /^[a-z]/i.test(b.title[0]) ? b.title[0].toUpperCase() : '#'
      map.set(k, [...(map.get(k) ?? []), b])
    }
    return [...map.entries()].sort(([a], [b]) =>
      a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b),
    )
  }, [brands])

  useGSAP(
    () =>
      motionOK(() => {
        const el = ref.current
        if (!el) return
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.55,
            ease: 'power3.out',
            clearProps: 'clipPath',
          },
        )
        gsap.from(el.querySelectorAll('[data-mega-item]'), {
          opacity: 0,
          y: 14,
          duration: 0.5,
          stagger: 0.012,
          delay: 0.1,
          ease: 'power3.out',
        })
      }),
    { scope: ref },
  )

  const featured = item.featured
  const featuredImage =
    featured?.image && typeof featured.image === 'object' ? featured.image : null
  const hasFeatured = !!(featuredImage || featured?.title)

  return (
    <div
      ref={ref}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) onNavigate()
      }}
      className="absolute inset-x-0 top-full border-t bg-background text-foreground shadow-xl"
    >
      <div
        className={`container grid gap-10 py-10 ${hasFeatured ? 'lg:grid-cols-[1fr_22rem]' : ''}`}
      >
        <div data-lenis-prevent className="max-h-[60vh] overflow-y-auto pr-4">
          {item.source === 'allBrands' ? (
            <>
              <Link
                data-mega-item
                href="/brands"
                className="mb-8 inline-block text-xs font-bold uppercase tracking-[0.2em] underline-offset-4 hover:underline"
              >
                View all brands →
              </Link>
              <div className="columns-2 gap-x-10 md:columns-3">
                {groups.map(([letter, list]) => (
                  <div key={letter} className="mb-6 break-inside-avoid">
                    <p data-mega-item className="mb-2 font-mono text-xs text-primary/40">
                      {letter}
                    </p>
                    <ul>
                      {list.map((b) => (
                        <li key={b.id} data-mega-item>
                          <Link
                            href={`/shop/${b.slug}`}
                            className="block py-1 text-sm uppercase tracking-wide transition-opacity hover:opacity-50"
                          >
                            {b.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
              {item.columns?.map((col) => (
                <div key={col.id}>
                  {col.heading && (
                    <p data-mega-item className="mb-3 font-mono text-xs uppercase text-primary/40">
                      {col.heading}
                    </p>
                  )}
                  <ul>
                    {col.links?.map((l) => (
                      <li key={l.id} data-mega-item className="py-1">
                        <CMSLink
                          {...l.link}
                          appearance="link"
                          className="text-sm uppercase tracking-wide"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasFeatured && (
          <Link data-mega-item href={featured?.linkUrl || '#'} className="group block">
            {featuredImage && (
              <div className="relative aspect-4/5 overflow-hidden bg-muted">
                <Media
                  fill
                  resource={featuredImage}
                  className="absolute inset-0"
                  imgClassName="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
            )}
            {featured?.title && <p className="mt-4 text-lg font-bold">{featured.title}</p>}
            {featured?.linkLabel && (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em]">
                {featured.linkLabel} →
              </p>
            )}
          </Link>
        )}
      </div>
    </div>
  )
}
