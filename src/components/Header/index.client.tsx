'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'
import { Logo } from '../Logo/Logo'
import { SearchIcon } from 'lucide-react'
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

  return (
    <div className="relative z-20 border-b">
      <nav className="flex items-center md:items-end justify-between uppercase container pt-2">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
        <div className="flex w-full items-end justify-between">
          <div className="flex w-full items-end gap-6 md:w-1/3">
            <Link className="flex w-full items-center justify-center pt-4 pb-4 md:w-auto" href="/">
              <Logo className="w-6 h-auto" />
            </Link>
            {menu.length ? (
              <div className="hidden gap-4 text-sm md:flex md:items-center">
                <NavigationMenu className="hidden gap-4 text-sm md:flex md:items-center">
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-0 py-0 uppercase h-auto bg-transparent hover:bg-transparent data-[state=open]:bg-transparent data-[state=open]:focus:bg-transparent data-[state=open]:hover:bg-transparent text-primary/50 hover:text-primary [&.active]:text-primary p-0 pt-2 pb-6 font-mono tracking-widest text-xs relative navLink">
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
                                  className="relative navLink"
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
                        className={cn('relative navLink', {
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

          <div className="flex justify-end md:w-1/3 gap-4">
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
        </div>
      </nav>
    </div>
  )
}
