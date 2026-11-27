import type { ArchiveBlock as ArchiveBlockProps, Post, Product } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { FeaturedProductsCarousel } from '@/components/featured-carousel'
import { Grid } from '@/components/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { ProductGridItem } from '@/components/ProductGridItem'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { CarouselItem } from '@/components/ui/carousel'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload, Where } from 'payload'
import React from 'react'

type ID = string | number

const idOf = (v: unknown): ID | undefined =>
  (v && typeof v === 'object' ? (v as { id: ID }).id : v) as ID | undefined

const idsOf = (v: unknown): ID[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map(idOf).filter((x): x is ID => x != null)

export const ArchiveBlock: React.FC<ArchiveBlockProps & { id?: string }> = async (props) => {
  const {
    id,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs,
    categories,
    watchCollections,
    watchModels,
    movement,
    caseMaterial,
    relationTo,
    filterType,
  } = props

  const limit = limitFromProps || 3
  const payload = await getPayload({ config: configPromise })

  const brandIds = idsOf(categories)
  const collectionIds = idsOf(watchCollections)
  const modelIds = idsOf(watchModels)

  let docs: (Post | Product)[] = []

  if (populateBy === 'collection') {
    const and: Where[] = [{ _status: { equals: 'published' } }]

    if (relationTo === 'products') {
      and.push({ inventory: { greater_than: 0 } })

      // Most specific taxonomy level wins; each level implies the ones above it.
      if (modelIds.length) and.push({ watchModel: { in: modelIds } })
      else if (collectionIds.length) and.push({ watchCollection: { in: collectionIds } })
      else if (brandIds.length) and.push({ brand: { in: brandIds } })

      if (movement?.length) and.push({ 'specs.movement': { in: movement } })
      if (caseMaterial?.length) and.push({ 'specs.caseMaterial': { in: caseMaterial } })

      if (filterType === 'featured') and.push({ isFeatured: { equals: true } })
      if (filterType === 'limited') and.push({ isLimitedEdition: { equals: true } })
      if (filterType === 'onSale') and.push({ isOnSale: { equals: true } })
      if (filterType === 'new-arrival')
        and.push({
          createdAt: {
            greater_than: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
        })
    } else if (brandIds.length) {
      and.push({ categories: { in: brandIds } })
    }

    const fetched = await payload.find({
      collection: relationTo || 'posts',
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit,
      where: { and },
    })

    docs = fetched.docs
  } else if (selectedDocs?.length) {
    docs = selectedDocs
      .map((d) => (typeof d.value === 'object' ? d.value : null))
      .filter(Boolean) as (Post | Product)[]
  }

  // ── "View more" link, carrying the same filters into the shop ───────────
  const slugsFor = async (collection: 'watchModels' | 'watchCollections', ids: ID[]) => {
    if (!ids.length) return []
    const res = await payload.find({
      collection,
      where: { id: { in: ids } },
      depth: 0,
      pagination: false,
      select: { slug: true },
    })
    return res.docs.map((d) => d.slug).filter(Boolean) as string[]
  }

  let viewMoreLink: string | null = null

  if (relationTo === 'products') {
    switch (filterType) {
      case 'new-arrival':
        viewMoreLink = '/shop/new-arrival'
        break
      case 'onSale':
        viewMoreLink = '/shop/on-sale'
        break
      case 'featured':
        viewMoreLink = null
        break
      default:
        viewMoreLink = '/shop/all'
    }

    if (viewMoreLink && populateBy === 'collection') {
      const qs = new URLSearchParams()

      if (modelIds.length) qs.set('model', (await slugsFor('watchModels', modelIds)).join(','))
      else if (collectionIds.length)
        qs.set('collection', (await slugsFor('watchCollections', collectionIds)).join(','))
      else if (brandIds.length) qs.set('category', brandIds.join(','))

      if (movement?.length) qs.set('movement', movement.join(','))
      if (caseMaterial?.length) qs.set('material', caseMaterial.join(','))
      if (filterType === 'limited') qs.set('limited', 'true')

      const query = qs.toString()
      if (query) viewMoreLink += `?${query}`
    }
  } else {
    viewMoreLink = '/posts'
  }

  return (
    <div className="md:my-16" id={`block-${id}`}>
      {introContent && (
        <div className="px-4 mb-10 md:mb-16 flex items-center justify-between">
          <Reveal>
            <RichText
              className="ms-0 max-w-3xl text-lg md:text-3xl font-light tracking-tight prose-headings:font-light"
              data={introContent}
              enableGutter={false}
            />
          </Reveal>
          {viewMoreLink && (
            <Reveal delay={0.15}>
              <Link href={viewMoreLink}>
                <Button variant="ghost">View more</Button>
              </Link>
            </Reveal>
          )}
        </div>
      )}

      {relationTo === 'products' ? (
        // filterType === 'featured' ? (
        //   <Reveal className="px-4">
        //     <FeaturedProductsCarousel>
        //       {(docs as Product[]).map((product) => (
        //         <CarouselItem key={product.id} className="pl-0 basis-1/2 sm:basis-1/3 lg:basis-1/4">
        //           <div className="border-t border-l border-foreground">
        //             <ProductGridItem product={product} />
        //           </div>
        //         </CarouselItem>
        //       ))}
        //     </FeaturedProductsCarousel>
        //   </Reveal>
        // ) : (
        //   <StaggerGroup className="px-4">
        //     <Grid className="grid grid-cols-2 gap-0! border-t border-l border-foreground md:grid-cols-3 lg:grid-cols-4">
        //       {(docs as Product[]).map((product) => (
        //         <ProductGridItem key={product.id} product={product} />
        //       ))}
        //     </Grid>
        //   </StaggerGroup>
        // )
        <Reveal className="px-4">
          <FeaturedProductsCarousel>
            {(docs as Product[]).map((product) => (
              <CarouselItem key={product.id} className="pl-0 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                <div className="border-t border-l border-foreground">
                  <ProductGridItem product={product} />
                </div>
              </CarouselItem>
            ))}
          </FeaturedProductsCarousel>
        </Reveal>
      ) : (
        <StaggerGroup>
          <CollectionArchive posts={docs as Post[]} />
        </StaggerGroup>
      )}
    </div>
  )
}
