'use client'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post, Search } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { useClickableCard } from '@/utilities/useClickableCard'
import { Media } from '../Media'

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: Post | Search
  relationTo?: 'posts' | 'products'
  showCategories?: boolean
  showBadge?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const {
    className,
    doc,
    relationTo,
    showCategories,
    showBadge = false,
    title: titleFromProps,
  } = props

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const href = `/${relationTo}/${slug}`

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full ">
        {showBadge && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold uppercase',
                relationTo === 'products' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white',
              )}
            >
              {relationTo === 'products' ? 'Product' : 'Post'}
            </span>
          </div>
        )}
        {!metaImage && <div className="">No image</div>}
        {metaImage && typeof metaImage !== 'string' && (
          <Media
            resource={metaImage}
            size="360px"
            className="relative aspect-square object-cover border bg-primary-foreground"
            imgClassName="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        {showCategories && hasCategories && (
          <div className="uppercase text-sm mb-4">
            {categories?.map((category, index) => {
              if (typeof category === 'object') {
                const { title: titleFromCategory } = category
                const categoryTitle = titleFromCategory || 'Untitled category'
                const isLast = index === categories.length - 1

                return (
                  <Fragment key={index}>
                    {categoryTitle}
                    {!isLast && <Fragment>, &nbsp;</Fragment>}
                  </Fragment>
                )
              }
              return null
            })}
          </div>
        )}
        {titleToUse && (
          <div className="prose dark:prose-invert">
            <h3>
              <Link className="" href={href} ref={link.ref}>
                {titleToUse}
              </Link>
            </h3>
          </div>
        )}
        {description && (
          <div className="mt-2">
            <p>{sanitizedDescription}</p>
          </div>
        )}
      </div>
    </article>
  )
}
