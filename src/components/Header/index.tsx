import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient } from './index.client'
import type { MenuBrand } from './types'

const getMenuBrands = unstable_cache(
  async (): Promise<MenuBrand[]> => {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 500,
      pagination: false,
      sort: 'title',
      select: { title: true, slug: true },
      where: { showInMenu: { not_equals: false } },
    })
    return res.docs
      .filter((b: any) => b.title && b.slug)
      .map((b: any) => ({ id: String(b.id), title: b.title, slug: b.slug }))
  },
  ['menu-brands'],
  { tags: ['menu-brands'] },
)

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const needsBrands = header.navItems?.some(
    (i) => i.type === 'megaMenu' && i.source === 'allBrands',
  )
  const brands = needsBrands ? await getMenuBrands() : []

  return <HeaderClient header={header} brands={brands} />
}
