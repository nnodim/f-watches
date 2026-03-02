'use client'

import { Price } from '@/components/Price'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCart, useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import { OpenCartButton } from './OpenCart'
import { Button } from '@/components/ui/button'
import { Cart, Product } from '@/payload-types'
import { getEffectivePrice } from '@/lib/pricing'
import { cn } from '@/utilities/cn'

export function CartModal() {
  const { cart } = useCart()
  const { currency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const discountAmount =
    currency.code === 'NGN' ? cart?.discountAmountInNGN : cart?.discountAmountInUSD

  const pathname = usePathname()

  useEffect(() => {
    // Close the cart modal when the pathname changes.
    setIsOpen(false)
  }, [pathname])

  const totalQuantity = useMemo(() => {
    if (!cart || !cart.items || !cart.items.length) return undefined
    return cart.items.reduce((quantity, item) => (item.quantity || 0) + quantity, 0)
  }, [cart])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <OpenCartButton quantity={totalQuantity} />
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>

          <SheetDescription>Manage your cart here, add items to view the total.</SheetDescription>
        </SheetHeader>

        {!cart || cart?.items?.length === 0 ? (
          <div className="text-center flex flex-col items-center gap-2">
            <ShoppingCart className="h-16" />
            <p className="text-center text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grow flex px-4">
            <div className="flex flex-col justify-between w-full">
              <ul className="grow overflow-auto py-4">
                {(cart as Cart)?.items?.map((item, i) => {
                  const product = item.product
                  const variant = item.variant

                  if (typeof product !== 'object' || !item || !product || !product.slug)
                    return <React.Fragment key={i} />

                  const metaImage =
                    product.meta?.image && typeof product.meta?.image === 'object'
                      ? product.meta.image
                      : undefined

                  const firstGalleryImage =
                    typeof product.gallery?.[0]?.image === 'object'
                      ? product.gallery?.[0]?.image
                      : undefined

                  let image = firstGalleryImage || metaImage
                  let price: number | null = null
                  let compareAt: number | null = null

                  const isVariant = Boolean(variant) && typeof variant === 'object'

                  if (isVariant) {
                    price = getEffectivePrice(variant as any, currency.code).price

                    const imageVariant = product.gallery?.find((item) => {
                      if (!item.variantOption) return false
                      const variantOptionID =
                        typeof item.variantOption === 'object'
                          ? item.variantOption.id
                          : item.variantOption

                      const hasMatch = variant?.options?.some((option) => {
                        if (typeof option === 'object') return option.id === variantOptionID
                        else return option === variantOptionID
                      })

                      return hasMatch
                    })

                    if (imageVariant && typeof imageVariant.image === 'object') {
                      image = imageVariant.image
                    }
                  }

                  if (!isVariant) {
                    price = getEffectivePrice(product as any, currency.code).price
                    compareAt = getEffectivePrice(product as any, currency.code).compareAt
                  }

                  return (
                    <li className="flex w-full flex-col" key={i}>
                      <div className="relative flex w-full flex-row justify-between px-1 py-4">
                        <div className="absolute z-40 -mt-2 ml-13.75">
                          <DeleteItemButton item={item} />
                        </div>
                        <Link
                          className="z-30 flex flex-row space-x-4"
                          href={`/products/${(item.product as Product)?.slug}`}
                        >
                          <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-md border border-neutral-300 bg-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                            {image?.url && (
                              <Image
                                alt={image?.alt || product?.title || ''}
                                className="h-full w-full object-cover"
                                height={94}
                                src={image.url}
                                width={94}
                              />
                            )}
                          </div>

                          <div className="flex flex-1 flex-col text-base">
                            <span className="leading-tight">{product?.title}</span>
                            {isVariant && variant ? (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                                {variant.options
                                  ?.map((option) => {
                                    if (typeof option === 'object') return option.label
                                    return null
                                  })
                                  .join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                        <div className="flex h-16 flex-col gap-1 justify-between">
                          {typeof price === 'number' && (
                            <div className='flex flex-col items-end gap-1'>
                              <Price
                                amount={price}
                                className={cn('flex justify-end space-y-2 text-right text-sm', {
                                  'text-red-400':
                                    typeof compareAt === 'number' && compareAt > price,
                                })}
                              />
                              {typeof compareAt === 'number' && compareAt > price && (
                                <span className="text-xs line-through">
                                  <Price amount={compareAt} as="span" />
                                </span>
                              )}
                            </div>
                          )}
                          <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
                            <EditItemQuantityButton item={item} type="minus" />
                            <p className="w-6 text-center">
                              <span className="w-full text-sm">{item.quantity}</span>
                            </p>
                            <EditItemQuantityButton item={item} type="plus" />
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="px-4">
                <div className="py-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {typeof cart?.subtotal === 'number' && (
                    <div className="mb-3 flex flex-col gap-2 border-b border-neutral-200 pb-1 pt-1 dark:border-neutral-700">
                      {typeof discountAmount === 'number' && discountAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <p>Discount</p>
                          <Price
                            amount={discountAmount}
                            className="text-right text-base text-black dark:text-white"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p>Total</p>
                        <Price
                          amount={cart?.total ?? cart?.subtotal}
                          className="text-right text-base text-black dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <Button asChild>
                    <Link className="w-full" href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
