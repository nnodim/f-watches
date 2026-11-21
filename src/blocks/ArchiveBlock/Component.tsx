import type { ArchiveBlock as ArchiveBlockProps, Post, Product } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { FeaturedProductsCarousel } from '@/components/featured-carousel'
import { Grid } from '@/components/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { ProductGridItem } from '@/components/ProductGridItem'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import {
  CarouselItem
} from '@/components/ui/carousel'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload, Where } from 'payload'
import React from 'react'

export const ArchiveBlock: React.FC<ArchiveBlockProps & { id?: string }> = async (props) => {
  const {
    id,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs,
    categories,
    relationTo,
    filterType,
  } = props

  const limit = limitFromProps || 3
  const payload = await getPayload({ config: configPromise })

  let docs: (Post | Product)[] = []

  if (populateBy === 'collection') {
    const flattenedCategories = categories?.map((c) => (typeof c === 'object' ? c.id : c))

    const where: Where = {}

    if (flattenedCategories?.length) {
      where.categories = { in: flattenedCategories }
    }

    if (relationTo === 'products') {
      where.inventory = { greater_than: 0 }

      if (filterType === 'featured') where.isFeatured = { equals: true }
      if (filterType === 'onSale') where.isOnSale = { equals: true }
      if (filterType === 'new-arrival')
        where.createdAt = {
          greater_than: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        }
    }
    const fetchedDocs = await payload.find({
      collection: relationTo || 'posts',
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit,
      where: Object.keys(where).length
        ? { and: [where, { _status: { equals: 'published' } }] }
        : { _status: { equals: 'published' } },
    })

    docs = fetchedDocs.docs
  } else if (selectedDocs?.length) {
    docs = selectedDocs
      .map((d) => (typeof d.value === 'object' ? d.value : null))
      .filter(Boolean) as (Post | Product)[]
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
  } else {
    viewMoreLink = '/posts'
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16 flex items-center justify-between">
          <Reveal>
            <RichText className="ms-0 max-w-3xl" data={introContent} enableGutter={false} />
          </Reveal>
          {viewMoreLink && (
            <Reveal delay={0.15}>
              <Link href={viewMoreLink}>
                <Button variant="ghost" className="mb-4">
                  View more
                </Button>
              </Link>
            </Reveal>
          )}
        </div>
      )}

      {relationTo === 'products' ? (
        filterType === 'featured' ? (
          <Reveal className="">
            <FeaturedProductsCarousel>
              {(docs as Product[]).map((product) => (
                <CarouselItem key={product.id} className="pl-0 sm:basis-1/3 lg:basis-1/4">
                  <div>
                    <ProductGridItem product={product} />
                  </div>
                </CarouselItem>
              ))}
            </FeaturedProductsCarousel>
          </Reveal>
        ) : (
          // StaggerGroup sees one child (the grid) and staggers the grid's items.
          <StaggerGroup className="">
            <Grid className="grid grid-cols-2 gap-0! sm:grid-cols-3 lg:grid-cols-4">
              {(docs as Product[]).map((product) => (
                <ProductGridItem key={product.id} product={product} />
              ))}
            </Grid>
          </StaggerGroup>
        )
      ) : (
        <StaggerGroup>
          <CollectionArchive posts={docs as Post[]} />
        </StaggerGroup>
      )}
    </div>
  )
}
