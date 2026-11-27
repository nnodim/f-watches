import type { Header } from '@/payload-types'

export type NavItem = NonNullable<Header['navItems']>[number]
export type MenuBrand = { id: string; title: string; slug: string }
