'use client'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import React, { Suspense, useRef } from 'react'

import type { Header } from 'src/payload-types'
import { MobileMenu } from './MobileMenu'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

import { gsap, motionOK, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/utilities/cn'
import { usePathname } from 'next/navigation'
import { Logo } from '../Logo/Logo'
import { Button } from '../ui/button'

type Props = {
  header: Header
}

export const links: { title: string; href: string }[] = [
  { title: 'All', href: '/shop/all' },
  { title: 'New Arrivals', href: '/shop/new-arrival' },
  { title: 'Collections', href: '/brands' },
]

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()
  const bar = useRef<HTMLDivElement>(null)
  const isHome = pathname === '/'

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

  return (
    <>
      {header.announcement ? (
        <div className="bg-primary px-4 py-2.5 text-center text-xs uppercase tracking-[0.18em] text-primary-foreground">
          {header.announcement}
        </div>
      ) : null}

      <div
        ref={bar}
        className={cn(
          'z-50 w-full',
          isHome
            ? 'absolute inset-x-0 top-0 border-transparent bg-transparent text-white'
            : 'sticky top-0 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80',
        )}
      >
        <nav className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center uppercase md:h-20">
          {/* Left: mobile menu / desktop navigation */}
          <div className="flex items-center gap-6">
            <div className="block flex-none md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>

            {menu.length ? (
              <div className="hidden gap-4 text-sm md:flex md:items-center">
                <NavigationMenu className="hidden gap-4 text-sm md:flex md:items-center">
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="navLink relative h-auto bg-transparent p-0 pt-2 pb-6 font-mono text-xs uppercase tracking-widest text-primary/50 hover:bg-transparent hover:text-primary data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent [&.active]:text-primary">
                        Shop
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-50 gap-1 p-4">
                          {links.map((link, i) => (
                            <li key={i}>
                              <NavigationMenuLink asChild>
                                <CMSLink
                                  size={'clear'}
                                  label={link.title}
                                  url={link.href}
                                  className="navLink relative"
                                  appearance="nav"
                                />
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
                <ul className="hidden gap-4 text-sm md:flex md:items-center">
                  {menu.map((item) => (
                    <li key={item.id}>
                      <CMSLink
                        {...item.link}
                        size={'clear'}
                        className={cn('navLink relative', {
                          active:
                            item.link.url && item.link.url !== '/'
                              ? pathname.includes(item.link.url)
                              : false,
                        })}
                        appearance="nav"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Centre: logo */}
          <Link className="flex items-center justify-center py-4" href="/" aria-label="Home">
            <Logo className="h-auto w-7 md:w-8" />
          </Link>

          {/* Right: search + cart */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/search">
              <Button
                variant="nav"
                size="clear"
                className="navLink relative items-end hover:cursor-pointer"
              >
                <span>Search</span>
              </Button>
            </Link>
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </nav>
      </div>
    </>
  )
}
