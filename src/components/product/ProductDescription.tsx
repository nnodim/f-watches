'use client'
import type { Product, Variant } from '@/payload-types'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React, { Suspense } from 'react'

import RelatedProducts from '../RelatedProducts'
import { getEffectivePrice } from '@/lib/pricing'
import { cn } from '@/utilities/cn'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from './VariantSelector'

export function ProductDescription({ product }: { product: Product }) {
  const { currency } = useCurrency()
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  if (hasVariants) {
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        const aPrice = getEffectivePrice(a as Variant, currency.code).price ?? 0
        const bPrice = getEffectivePrice(b as Variant, currency.code).price ?? 0
        return aPrice - bPrice
      }) as Variant[]

    const lowestVariant = variantsOrderedByPrice?.[0]
    const highestVariant = variantsOrderedByPrice?.[variantsOrderedByPrice.length - 1]

    if (lowestVariant && highestVariant) {
      lowestAmount = getEffectivePrice(lowestVariant, currency.code).price ?? 0
      highestAmount = getEffectivePrice(highestVariant, currency.code).price ?? 0
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = getEffectivePrice(product as Product, currency.code).price ?? 0
  }

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []
  const compareAt = getEffectivePrice(product as Product, currency.code).compareAt

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-medium font-roboto">{product.title}</h1>
        <div className="uppercase font-mono">
          {hasVariants ? (
            <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
          ) : (
            <div className="flex flex-col items-end gap-1">
              <Price
                className={cn('text-2xl font-semibold', {
                  'text-red-400': compareAt && compareAt > amount,
                })}
                amount={amount}
              />
              {typeof compareAt === 'number' && compareAt > amount && (
                <span className="text-sm line-through">
                  <Price amount={compareAt} as="span" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <hr />

      {relatedProducts.length ? (
        <div>
          <RelatedProducts small={true} products={relatedProducts as Product[]} />
        </div>
      ) : null}

      {hasVariants && (
        <>
          <hr />
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>
          <hr />
        </>
      )}

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
      </div>

      {product.description ? <RichText data={product.description} enableGutter={false} /> : null}
    </div>
  )
}
