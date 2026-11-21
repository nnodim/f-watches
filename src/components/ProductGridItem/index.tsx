import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { getEffectivePrice } from '@/lib/pricing'
import { cn } from '@/utilities/cn'
import { Eye, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  product: Partial<Product>
  /** Wire these to your quick-view modal / cart. Without them both buttons open the product page. */
  onQuickView?: (product: Partial<Product>) => void
  onAddToCart?: (product: Partial<Product>) => void
}

const NEW_DAYS = 30

export const ProductGridItem: React.FC<Props> = ({ product, onQuickView, onAddToCart }) => {
  const { gallery, title } = product
  const href = `/products/${product.slug}`

  // ---- price (unchanged logic) ----
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

  // "NEW" if created in the last 30 days (swap for your own boolean field if you have one)
  const isNew =
    !!product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000

  // Small grey line above the bold name (first category, if populated)
  const firstCategory = (product as any).categories?.[0]
  const eyebrow = firstCategory && typeof firstCategory === 'object' ? firstCategory.title : null

  const priceNode =
    typeof price === 'number' ? (
      <span className="flex items-baseline gap-2">
        <Price
          amount={price}
          className={cn('font-bold', { 'text-red-500': compareAt && compareAt > price })}
        />
        {typeof compareAt === 'number' && compareAt > price && (
          <span className="text-xs font-normal text-muted-foreground line-through">
            <Price amount={compareAt} as="span" />
          </span>
        )}
      </span>
    ) : null

  const actionClass =
    'flex h-full items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background'

  return (
    // Cell borders are right + bottom; the grid wrapper supplies top + left (see notes).
    <article className="group relative flex h-full flex-col border border-foreground bg-background">
      {/* ---------- Image area ---------- */}
      <Link href={href} className="relative block aspect-3/4 overflow-hidden">
        {isNew && (
          <span
            aria-hidden
            className="absolute right-0 top-0 z-20 flex h-14 w-21 items-center justify-center border-b border-l border-foreground text-xs font-bold uppercase tracking-wide text-green-600"
          >
            New
            {/* crosshair tails that extend past the box */}
            <span className="absolute -left-5 -bottom-px h-px w-5 bg-foreground" />
            <span className="absolute -bottom-5 -left-px h-5 w-px bg-foreground" />
          </span>
        )}

        {image ? (
          <Media
            className="absolute inset-0 p-10 md:p-14"
            imgClassName="h-full w-full object-contain transition duration-500 ease-out md:group-hover:scale-105 md:group-hover:opacity-60 md:group-hover:blur-md"
            resource={image}
            height={800}
            width={600}
          />
        ) : null}

        {/* Hover overlay: big name + price over the blurred image */}
        <div className="pointer-events-none absolute inset-0 z-10 hidden flex-col justify-center gap-3 p-10 opacity-0 transition-opacity duration-300 md:flex md:group-hover:opacity-100">
          {eyebrow && <span className="text-lg leading-none text-foreground/80">{eyebrow}</span>}
          <h3 className="text-4xl font-bold leading-[0.95] tracking-tight text-foreground">
            {title}
          </h3>
          {priceNode && <span className="mt-2 text-2xl">{priceNode}</span>}
        </div>
      </Link>

      {/* ---------- Bottom bar ---------- */}
      <div className="relative h-20 border-t border-foreground">
        {/* default: name left, price right */}
        <Link
          href={href}
          className="flex h-full items-center justify-between gap-4 px-5 transition-opacity duration-200 md:group-hover:opacity-0"
        >
          <span className="min-w-0">
            {eyebrow && (
              <span className="block truncate text-sm leading-tight text-muted-foreground">
                {eyebrow}
              </span>
            )}
            <span className="block truncate text-lg font-bold leading-tight">{title}</span>
          </span>
          <span className="shrink-0 text-lg">{priceNode}</span>
        </Link>

        {/* hover (desktop): Quick view | Add to cart */}
        <div className="pointer-events-none absolute inset-0 hidden grid-cols-2 divide-x divide-foreground bg-background opacity-0 transition-opacity duration-200 md:grid md:group-hover:pointer-events-auto md:group-hover:opacity-100">
          {onQuickView ? (
            <button type="button" className={actionClass} onClick={() => onQuickView(product)}>
              <Eye className="size-5" /> Quick view
            </button>
          ) : (
            <Link href={href} className={actionClass}>
              <Eye className="size-5" /> Quick view
            </Link>
          )}
          {onAddToCart ? (
            <button type="button" className={actionClass} onClick={() => onAddToCart(product)}>
              <ShoppingCart className="size-5" /> Add to cart
            </button>
          ) : (
            <Link href={href} className={actionClass}>
              <ShoppingCart className="size-5" /> Add to cart
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
