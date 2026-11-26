'use client'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { ChevronDown, MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MenuBrand, NavItem } from './types'
// import { links } from './index.client'

interface Props {
  menu: NavItem[] | null | undefined
  brands: MenuBrand[]
}

export function MobileMenu({ menu, brands }: Props) {
  const { user } = useAuth()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:bg-black dark:text-white">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="px-4">
        <SheetHeader className="px-0 pt-4 pb-0 sr-only">
          <SheetTitle>My Store</SheetTitle>

          <SheetDescription />
        </SheetHeader>

        <div className="pt-4">
          <ul className="flex w-full flex-col">
            {menu?.map((item) =>
              item.type === 'megaMenu' ? (
                <li key={item.id} className="border-b">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-base uppercase">
                      {item.label}
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="pb-4 pl-2">
                      {item.source === 'allBrands' ? (
                        <ul className="flex flex-col">
                          <li>
                            <Link
                              href="/brands"
                              className="block py-1.5 text-sm font-bold uppercase"
                            >
                              View all brands →
                            </Link>
                          </li>
                          {brands.map((b) => (
                            <li key={b.id}>
                              <Link
                                href={`/brands/${b.slug}`}
                                className="block py-1.5 text-sm uppercase"
                              >
                                {b.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        item.columns?.map((col) => (
                          <div key={col.id} className="mb-3">
                            {col.heading && (
                              <p className="mb-1 font-mono text-xs uppercase text-primary/50">
                                {col.heading}
                              </p>
                            )}
                            <ul>
                              {col.links?.map((l) => (
                                <li key={l.id} className="py-1.5">
                                  <CMSLink
                                    {...l.link}
                                    appearance="link"
                                    className="text-sm uppercase"
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </li>
              ) : (
                <li className="border-b py-3" key={item.id}>
                  <CMSLink {...item.link} className="text-base uppercase" appearance="link" />
                </li>
              ),
            )}
          </ul>
        </div>

        {user ? (
          <div className="mt-4">
            <h2 className="text-xl mb-4">My account</h2>
            <hr className="my-2" />
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/orders">Orders</Link>
              </li>
              <li>
                <Link href="/account/addresses">Addresses</Link>
              </li>
              <li>
                <Link href="/account">Manage account</Link>
              </li>
              <li className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/logout">Log out</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center gap-2 mt-4">
              <Button asChild className="w-full" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span>or</span>
              <Button asChild className="w-full">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
