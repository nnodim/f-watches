'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from '@/lib/gsap'
import { Media } from '@/components/Media'

export type BentoPost = {
  id: string | number
  slug: string
  title: string
  category: string | null
  date: string | null
  image: any | null
}

// The pen's bento layout: 3 columns x 4 rows (md and up)
type Layout = { cols: number; rows: number; areas: [number, number, number, number][] }

const LAYOUTS: Record<number, Layout> = {
  1: { cols: 1, rows: 1, areas: [[1, 1, 2, 2]] },
  2: {
    cols: 2,
    rows: 1,
    areas: [
      [1, 1, 2, 2],
      [1, 2, 2, 3],
    ],
  },
  3: {
    cols: 2,
    rows: 2,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 3],
      [2, 2, 3, 3],
    ],
  },
  4: {
    cols: 3,
    rows: 2,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 4],
      [2, 2, 3, 3],
      [2, 3, 3, 4],
    ],
  },
  5: {
    cols: 3,
    rows: 2,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 3],
      [1, 3, 2, 4],
      [2, 2, 3, 3],
      [2, 3, 3, 4],
    ],
  },
  6: {
    cols: 3,
    rows: 3,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 4],
      [2, 2, 3, 3],
      [2, 3, 4, 4],
      [3, 1, 4, 2],
      [3, 2, 4, 3],
    ],
  },
  7: {
    cols: 3,
    rows: 3,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 4],
      [2, 2, 3, 3],
      [2, 3, 3, 4],
      [3, 1, 4, 2],
      [3, 2, 4, 3],
      [3, 3, 4, 4],
    ],
  },
  8: {
    cols: 3,
    rows: 4,
    areas: [
      [1, 1, 3, 2],
      [1, 2, 2, 3],
      [2, 2, 4, 3],
      [1, 3, 3, 4],
      [3, 1, 4, 2],
      [3, 3, 5, 4],
      [4, 1, 5, 2],
      [4, 2, 5, 3],
    ],
  },
}

export function BentoGrid({ posts: allPosts }: { posts: BentoPost[] }) {
  const router = useRouter()
  const busy = useRef(false)

  const posts = allPosts.slice(0, 8)
  const n = posts.length
  const layout = LAYOUTS[n]
  const mobileLastWide = n > 1 && (n - 1) % 2 === 1

  const open = (e: React.MouseEvent<HTMLAnchorElement>, post: BentoPost) => {
    // let new-tab / modified clicks behave normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (busy.current) return
    busy.current = true

    const href = `/posts/${post.slug}`
    router.prefetch(href)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(href)
      busy.current = false
      return
    }

    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const src = card.querySelector('img')?.currentSrc ?? ''
    // where the post hero will start on the next page (below announcement/header)
    const main = document.querySelector('main')
    const heroTop = main ? Math.max(0, main.getBoundingClientRect().top + window.scrollY) : 0
    const pageBg = getComputedStyle(document.body).backgroundColor

    // --- build the layer that survives the route change ---
    const layer = document.createElement('div')
    layer.setAttribute('data-post-transition', '')
    layer.style.cssText = 'position:fixed;inset:0;z-index:100;'

    const backdrop = document.createElement('div')
    backdrop.style.cssText = `position:absolute;inset:0;opacity:0;background:${pageBg};`

    const frame = document.createElement('div')
    frame.style.cssText = `position:absolute;overflow:hidden;background:#0a0a0a;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`

    const img = document.createElement('img')
    img.src = src
    img.alt = ''
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'

    const shade = document.createElement('div')
    shade.style.cssText =
      'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.65),rgba(0,0,0,0) 55%);'

    const title = document.createElement('div')
    title.textContent = post.title
    title.setAttribute('data-title', '')
    title.style.cssText =
      'position:absolute;left:0;right:0;bottom:0;padding:2rem;color:#fff;font-weight:700;line-height:1.05;letter-spacing:-.02em;font-size:clamp(2rem,5vw,4.5rem);opacity:0;transform:translateY(24px);'

    frame.append(img, shade, title)
    layer.append(backdrop, frame)
    document.body.append(layer)

    // safety net: never leave the layer stuck if navigation fails
    window.setTimeout(() => layer.isConnected && layer.remove(), 8000)

    gsap
      .timeline({
        defaults: { ease: 'expo.inOut' },
        onComplete: () => router.push(href),
      })
      .to(backdrop, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0)
      .to(
        frame,
        { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, duration: 1 },
        0,
      )
      .to(title, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.55)
  }

  return (
    <div
      style={{ '--cols': layout.cols, '--rows': layout.rows } as React.CSSProperties}
      className="grid grid-cols-2 auto-rows-[42vw] gap-1 md:h-[min(92svh,60rem)] md:auto-rows-auto md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:grid-rows-[repeat(var(--rows),minmax(0,1fr))]"
    >
      {posts.map((post, i) => {
        const [r1, c1, r2, c2] = layout.areas[i]
        const wideOnMobile = i === 0 || (mobileLastWide && i === n - 1)
        return (
          <Link
            key={post.id}
            href={`/posts/${post.slug}`}
            onClick={(e) => open(e, post)}
            style={{ '--area': `${r1}/${c1}/${r2}/${c2}` } as React.CSSProperties}
            className={`group relative block overflow-hidden bg-muted md:[grid-area:var(--area)] ${
              wideOnMobile ? 'max-md:col-span-2' : ''
            }`}
          >
            {post.image && (
              <Media
                fill
                resource={post.image}
                className="absolute inset-0"
                imgClassName="object-cover transition duration-700 ease-out group-hover:scale-105 group-hover:blur-sm group-hover:opacity-40"
              />
            )}

            {/* always-visible caption (the only info on touch devices) */}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4 pt-12 text-white transition-opacity duration-200 md:group-hover:opacity-0">
              <p className="line-clamp-2 text-sm font-bold md:text-base">{post.title}</p>
            </div>

            {/* hover overlay, same idea as the product card */}
            <div className="pointer-events-none absolute inset-0 hidden flex-col justify-end gap-3 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
              {post.category && (
                <span className="text-xs font-bold uppercase tracking-wide text-primary/70">
                  {post.category}
                </span>
              )}
              <h3 className="text-2xl font-bold leading-none tracking-tight text-primary lg:text-4xl">
                {post.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-primary/70">
                <span>
                  {post.date &&
                    new Date(post.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                </span>
                <span className="font-bold uppercase tracking-wide text-primary">Read →</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
