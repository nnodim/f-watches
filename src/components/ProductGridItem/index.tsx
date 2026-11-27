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
  /** Optional: open your quick-view modal instead of navigating */
  onQuickView?: (product: Partial<Product>) => void
  /** Optional: add to cart directly (only sensible for single-variant products) */
  onAddToCart?: (product: Partial<Product>) => void
}

const NEW_WINDOW_DAYS = 30

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

  // small grey line above the title (first category, if populated)
  const firstCategory = product.brand
  const label =
    firstCategory && typeof firstCategory === 'object' ? (firstCategory as any).title : null

  // "NEW" if created in the last 30 days
  const isNew =
    !!product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < NEW_WINDOW_DAYS * 864e5

  const onSale = typeof price === 'number' && typeof compareAt === 'number' && compareAt > price

  const priceNode =
    typeof price === 'number' ? (
      <span className="flex items-baseline gap-2">
        <Price amount={price} className={cn('font-bold', { 'text-red-500': onSale })} />
        {onSale && (
          <span className="text-xs font-normal line-through text-primary/40">
            <Price amount={compareAt!} as="span" />
          </span>
        )}
      </span>
    ) : null

  return (
    <article className="group relative flex h-full flex-col border-r border-b border-foreground bg-background">
      {/* ---------- image area ---------- */}
      <Link href={href} className="relative block flex-1" aria-label={title ?? 'View product'}>
        <div className="relative aspect-3/4 w-full overflow-hidden">
          {image && (
            <Media
              className="absolute inset-0 p-8 md:p-12"
              imgClassName="h-full w-full object-contain transition duration-500 ease-out group-hover:scale-105 group-hover:blur-md group-hover:opacity-40"
              resource={image}
              width={600}
              height={800}
            />
          )}

          {/* hover overlay: big title + price */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-12">
            {label && <span className="text-sm md:text-lg text-primary/70">{label}</span>}
            <h3 className="text-lg md:text-2xl font-bold leading-none tracking-tight text-primary lg:text-4xl">
              {title}
            </h3>
            <div className="text-xl">{priceNode}</div>
          </div>
        </div>
      </Link>

      {/* ---------- NEW tab with crosshair lines ---------- */}
      {isNew && (
        <div className="pointer-events-none absolute top-0 right-0 flex h-8 w-14 md:h-14 md:w-20 items-center justify-center border-b border-l border-foreground">
          <span className="text-xs font-bold uppercase tracking-wide text-green-600">New</span>
          {/* lines overshooting the corner */}
          <span className="absolute -left-5 -bottom-px h-px w-5 bg-foreground" />
          <span className="absolute -bottom-5 -left-px h-5 w-px bg-foreground" />
        </div>
      )}

      {/* ---------- bottom bar ---------- */}
      <div className="relative h-20 border-t border-foreground">
        {/* default: label / title / price */}
        <Link
          href={href}
          tabIndex={-1}
          className="absolute inset-0 flex items-center justify-between gap-4 px-3 md:px-6 transition-opacity duration-200 group-hover:opacity-0"
        >
          <span className="min-w-0">
            {label && <span className="block truncate text-[10px] text-primary/60">{label}</span>}
            <span className="block truncate text-xs md:text-lg font-bold leading-tight text-primary">
              {title}
            </span>
          </span>
          <span className="block shrink-0 text-xs md:text-lg">{priceNode}</span>
        </Link>

        {/* hover: quick view | add to cart */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <ActionButton
            className="border-b md:border-r md:border-b-0 border-foreground"
            href={href}
            onClick={onQuickView ? () => onQuickView(product) : undefined}
            icon={<Eye className="size-5" />}
            label="Quick view"
          />
          <ActionButton
            href={href}
            onClick={onAddToCart ? () => onAddToCart(product) : undefined}
            icon={<ShoppingCart className="size-5" />}
            label="Add to cart"
          />
        </div>
      </div>
    </article>
  )
}

/** Renders a <button> when a handler is given, otherwise a link to the product page. */
const ActionButton: React.FC<{
  href: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  className?: string
}> = ({ href, label, icon, onClick, className }) => {
  const cls = cn(
    'flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-background',
    className,
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {icon}
      {label}
    </button>
  ) : (
    <Link href={href} className={cls}>
      {icon}
      {label}
    </Link>
  )
}
