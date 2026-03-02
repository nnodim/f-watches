import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'
import { getEffectivePrice } from '@/lib/pricing'
import { cn } from '@/utilities/cn'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, title } = product


  const variants = product.variants?.docs
  let price: number | null = null
  let compareAt: number | null = null

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant.priceInNGN === 'number') {
      const effective = getEffectivePrice(variant as any, 'NGN')
      price = effective.price
      compareAt = effective.compareAt
    }
  } else if (product) {
    const effective = getEffectivePrice(product as any, 'NGN')
    price = effective.price
    compareAt = effective.compareAt
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      {image ? (
        <Media
          className={clsx('relative aspect-square object-cover p-4 md:p-8')}
          height={80}
          imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
            'transition duration-300 ease-in-out group-hover:scale-102': true,
          })}
          resource={image}
          width={80}
        />
      ) : null}

      <div className="font-mono text-primary flex justify-between flex-col-reverse gap-2 mt-4">
        <div>{title}</div>

        {typeof price === 'number' && (
          <div className="text-primary/50 flex items-center gap-2">
            <Price
              amount={price}
              className={cn('font-semibold', {
                'text-red-400': compareAt && compareAt > price,
              })}
            />
            {typeof compareAt === 'number' && compareAt > price && (
              <span className="text-xs line-through">
                <Price amount={compareAt} as="span" />
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
