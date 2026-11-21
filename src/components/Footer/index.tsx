import type { Footer } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { MaskText } from '@/components/motion/MaskText'
import { Reveal } from '@/components/motion/Reveal'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  FaFacebookF,
  FaInstagram,
  FaSnapchat,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
} from 'react-icons/fa6'
import { FooterMenu } from './menu'
import { MaskLogo } from '../motion/MaskLogo'

const { COMPANY_NAME, SITE_NAME } = process.env

const ICONS = {
  instagram: FaInstagram,
  tiktok: FaTiktok,
  snapchat: FaSnapchat,
  facebook: FaFacebookF,
  x: FaXTwitter,
  whatsapp: FaWhatsapp,
} as const

// Used until socials are filled in under Globals → Footer.
const DEFAULT_SOCIALS: { platform: keyof typeof ICONS; url: string }[] = [
  { platform: 'instagram', url: 'https://www.instagram.com/shopfwatches/' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@fwatches?_r=1&_t=ZS-94zBxkLUIit' },
  { platform: 'snapchat', url: 'https://snapchat.com/t/TmMOh5wP' },
]

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()
  const copyrightDate = currentYear > 2023 ? `${currentYear}` : ''
  const skeleton = 'w-full h-6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700'

  const copyrightName = COMPANY_NAME || SITE_NAME || ''
  const wordmark = SITE_NAME || 'F-WATCHES'
  const socials = footer.socials?.length ? footer.socials : DEFAULT_SOCIALS

  return (
    <footer className="overflow-hidden border-t border-neutral-200 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
      <div className="container grid gap-12 pt-16 md:grid-cols-2">
        {/* <Reveal className="flex flex-col gap-6">
          <Link className="flex items-center gap-2 text-black dark:text-white" href="/">
            <Logo className="" />
            <span className="sr-only">{SITE_NAME}</span>
          </Link>
          {footer.blurb ? <p className="max-w-xs leading-relaxed">{footer.blurb}</p> : null}
        </Reveal> */}

        <Reveal delay={0.1}>
          <Suspense
            fallback={
              <div className="flex h-47 w-50 flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
        </Reveal>

        <Reveal delay={0.2} className="flex w-fit flex-col gap-6 md:ml-auto">
          <ThemeSelector />
        </Reveal>
      </div>

      {/* Oversized wordmark, masks in on scroll */}
      <div className="container flex justify-center">
        <MaskLogo onLoad className="h-auto w-full max-w-[1218px]" />
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="container mx-auto flex w-full flex-col items-center justify-between gap-1 md:flex-row md:gap-0">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>
          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            {socials.map((s, i) => {
              const Icon = ICONS[s.platform as keyof typeof ICONS]
              if (!Icon) return null
              return (
                <Link
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  className="block text-muted-foreground hover:text-primary"
                >
                  <Icon />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
