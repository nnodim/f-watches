'use client'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import { gsap, motionOK, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import { Search, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import type { Header } from 'src/payload-types'
import { Logo } from '../Logo/Logo'
import { MegaPanel } from './mega-panel'
import { MobileMenu } from './MobileMenu'
import type { MenuBrand } from './types'

type Props = {
  header: Header
  brands: MenuBrand[]
}

export function HeaderClient({ header, brands }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()
  const { user } = useAuth()
  const bar = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/' || pathname.includes('/posts/')

  const [openId, setOpenId] = useState<string | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const openItem = menu.find((i) => i.id === openId && i.type === 'megaMenu')

  const open = (id: string) => {
    window.clearTimeout(closeTimer.current)
    setOpenId(id)
  }
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenId(null), 140)
  }
  const cancelClose = () => window.clearTimeout(closeTimer.current)

  useEffect(() => setOpenId(null), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Drops in on load, hides when scrolling down, returns on scroll up.
  useGSAP(
    () =>
      motionOK(() => {
        const el = bar.current
        if (!el) return
        gsap.from(el, { yPercent: -100, duration: 1, delay: 0.1, ease: 'power3.out' })

        let hidden = false
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate(self) {
            const wantHidden = self.direction === 1 && self.scroll() > 200
            if (wantHidden === hidden) return
            hidden = wantHidden
            gsap.to(el, {
              yPercent: wantHidden ? -100 : 0,
              duration: 0.5,
              ease: 'power3.out',
              overwrite: 'auto',
            })
          },
        })
      }),
    { scope: bar },
  )

  const solid = !!openItem

  return (
    <>
      {header.announcement ? (
        <div className="bg-primary px-4 py-2.5 text-center text-xs uppercase tracking-[0.18em] text-primary-foreground">
          {header.announcement}
        </div>
      ) : null}

      <div
        ref={bar}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className={cn(
          'z-50 w-full transition-colors duration-300',
          isHome
            ? solid
              ? 'absolute inset-x-0 top-0 border-b bg-background text-foreground'
              : 'absolute inset-x-0 top-0 border-transparent bg-transparent text-white'
            : 'sticky top-0 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80',
        )}
      >
        <nav className="container grid grid-cols-[1fr_auto_1fr] items-center uppercase">
          {/* Left */}
          <div className="flex items-center gap-6">
            <div className="block flex-none md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} brands={brands} />
              </Suspense>
            </div>

            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item) => {
                if (item.type === 'megaMenu') {
                  const isOpen = openId === item.id
                  return (
                    <li key={item.id} onMouseEnter={() => open(item.id!)}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => (isOpen ? setOpenId(null) : open(item.id!))}
                        className={cn(
                          'navLink relative py-6 font-mono text-xs uppercase tracking-widest transition-opacity',
                          isOpen ? 'opacity-100' : 'opacity-70 hover:opacity-100',
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                }
                return (
                  <li key={item.id} onMouseEnter={() => setOpenId(null)}>
                    <CMSLink
                      {...item.link}
                      size="clear"
                      className={cn('navLink relative py-6!', {
                        active:
                          item.link?.url && item.link.url !== '/'
                            ? pathname.includes(item.link.url)
                            : false,
                      })}
                      appearance="nav"
                    />
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Centre: logo */}
          <Link className="flex items-center justify-center py-4" href="/" aria-label="Home">
            <Logo className="h-auto" />
          </Link>

          {/* Right: search, account, cart */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="relative p-2 transition-opacity hover:opacity-60"
            >
              <Search className="size-5" strokeWidth={1.5} />
            </Link>
            <Link
              href={user ? '/account' : '/login'}
              aria-label={user ? 'My account' : 'Log in'}
              className="relative hidden p-2 transition-opacity hover:opacity-60 sm:block"
            >
              <User className="size-5" strokeWidth={1.5} />
            </Link>
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </nav>

        {openItem && (
          <MegaPanel item={openItem} brands={brands} onNavigate={() => setOpenId(null)} />
        )}
      </div>
    </>
  )
}
