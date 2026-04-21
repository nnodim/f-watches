'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { AddressItem } from '@/components/addresses/AddressItem'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { FormItem } from '@/components/forms/FormItem'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Address, Cart } from '@/payload-types'
import {
  useAddresses,
  useCart,
  usePayments,
  useCurrency,
} from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { getEffectivePrice } from '@/lib/pricing'
import { getNigeriaShippingFee } from '@/lib/shipping'
import posthog from 'posthog-js'

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, isLoading, clearCart, refreshCart } = useCart()
  const { currency } = useCurrency()
  const [error, setError] = useState<null | string>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const { confirmOrder } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [applyDiscountLoading, setApplyDiscountLoading] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  const customerEmail = user?.email || email
  const discountAmount =
    currency.code === 'NGN' ? cart?.discountAmountInNGN : cart?.discountAmountInUSD
  const resolvedShippingAddress = billingAddressSameAsShipping ? billingAddress : shippingAddress
  const shippingFeeResult = getNigeriaShippingFee({
    city: resolvedShippingAddress?.city,
    country: resolvedShippingAddress?.country,
    currency: currency.code,
    state: resolvedShippingAddress?.state,
  })
  const shippingFee = shippingFeeResult.amount
  const grandTotal =
    (cart?.total || 0) + (typeof shippingFee === 'number' ? shippingFee : 0)

    console.log(grandTotal);
    
  const canPay = canGoToPayment && typeof shippingFee === 'number'

  const applyDiscount = useCallback(async () => {
    if (!cart?.id) return

    setDiscountError(null)
    setApplyDiscountLoading(true)

    try {
      const cartSecret = typeof window !== 'undefined' ? localStorage.getItem('cart_secret') : null

      const response = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode,
          cartID: cart.id,
          secret: cartSecret || undefined,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const data = await response.json()

      if (data?.message) {
        setDiscountError(data.message)
        toast.error(data.message)
      } else {
        await refreshCart()
        posthog.capture('discount_code_applied', { discount_code: discountCode })
        toast.success('Discount code applied.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to apply discount.'
      setDiscountError(msg)
      toast.error(msg)
    } finally {
      setApplyDiscountLoading(false)
    }
  }, [cart?.id, discountCode, refreshCart])

  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  const initiatePaymentIntent = useCallback(async () => {
    if (!customerEmail) {
      setError('Email is required for payment')
      return
    }

    setIsProcessingPayment(true)
    setError(null)

    posthog.capture('checkout_payment_initiated', {
      cart_id: cart?.id,
      total: grandTotal,
      currency: currency.code,
      item_count: cart?.items?.length,
    })

    try {
      const cartSecret = typeof window !== 'undefined' ? localStorage.getItem('cart_secret') : null

      const response = await fetch('/api/payments/paystack/initiate-discounted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartID: cart?.id,
          secret: cartSecret || undefined,
          customerEmail,
          billingAddress,
          shippingAddress: resolvedShippingAddress,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      const paymentData = (await response.json()) as Record<string, unknown>

      if (paymentData?.zeroAmount && paymentData?.orderID && typeof paymentData.orderID === 'string') {
        const redirectUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/orders/${paymentData.orderID}${customerEmail ? `?email=${customerEmail}` : ''}`
        clearCart()
        toast.success('Order completed successfully. Redirecting to your order...')
        router.push(redirectUrl)
        return
      }

      if (paymentData && paymentData.accessCode) {
        const PaystackPop = (await import('@paystack/inline-js')).default
        const popup = new PaystackPop()

        const accessCode = paymentData.accessCode as string
        popup.resumeTransaction(accessCode, {
          async onSuccess(tranx) {
            try {
              const confirmResult = await confirmOrder('paystack', {
                additionalData: {
                  paymentReference: tranx.reference,
                  transactionId: tranx.transaction,
                  customerEmail,
                  billingAddress,
                  shippingAddress: resolvedShippingAddress,
                },
              })

              if (
                confirmResult &&
                typeof confirmResult === 'object' &&
                'orderID' in confirmResult &&
                confirmResult.orderID
              ) {
                posthog.capture('order_completed', {
                  order_id: confirmResult.orderID,
                  total: grandTotal,
                  currency: currency.code,
                  payment_method: 'paystack',
                })
                const redirectUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/orders/${confirmResult.orderID}${customerEmail ? `?email=${customerEmail}` : ''}`
                clearCart()
                toast.success('Payment successful! Redirecting to your order...')
                router.push(redirectUrl)
              }
            } catch (err) {
              console.log({ err })
              const msg = err instanceof Error ? err.message : 'Something went wrong.'
              const errorMessage = `Error while confirming order: ${msg}`
              setError(errorMessage)
              toast.error(errorMessage)
            } finally {
              setIsProcessingPayment(false)
            }
          },
          onCancel() {
            posthog.capture('checkout_payment_cancelled', {
              cart_id: cart?.id,
              currency: currency.code,
            })
            setIsProcessingPayment(false)
            toast.info('Payment was cancelled')
          },
        })
      }

      throw new Error('Payment initialization did not return a valid checkout session.')
    } catch (error) {
      console.log(error)

      const errorData = error instanceof Error ? JSON.parse(error.message) : {}
      let errorMessage = `An error occurred while initiating payment.${errorData}`

      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage = 'One or more items in your cart are out of stock.'
      }

      setError(errorMessage)
      toast.error(errorMessage)
      setIsProcessingPayment(false)
    }
  }, [
    billingAddress,
    customerEmail,
    cart?.id,
    cart?.items?.length,
    resolvedShippingAddress,
    confirmOrder,
    clearCart,
    router,
    grandTotal,
    currency.code,
  ])

  if (isLoading) {
    return (
      <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
        <div className="basis-full lg:basis-2/3 flex flex-col gap-8">
          <Skeleton className="h-9 w-40 rounded-md" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-md" />
        </div>
        <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 bg-primary/5 flex flex-col gap-6 rounded-lg">
          <Skeleton className="h-9 w-36 rounded-md" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 grow">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-4 w-1/4 rounded" />
              </div>
            </div>
          ))}
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-8 w-32 self-end rounded-md" />
        </div>
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="prose dark:prose-invert py-12 w-full items-center">
        <p>Your cart is empty.</p>
        <Link href="/search">Continue shopping?</Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-stretch justify-stretch my-8 md:flex-row grow gap-10 md:gap-6 lg:gap-8">
        <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
          <h2 className="font-medium text-3xl">Contact</h2>
          {!user && (
            <div className="bg-accent dark:bg-black rounded-lg p-4 w-full flex items-center">
              <div className="prose dark:prose-invert">
                <Button asChild className="no-underline text-inherit" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
                <p className="mt-0">
                  <span className="mx-2">or</span>
                  <Link href="/create-account">create an account</Link>
                </p>
              </div>
            </div>
          )}
          {user ? (
            <div className="bg-accent dark:bg-card rounded-lg p-4">
              <div>
                <p>{user.email}</p>
                <p>
                  Not you?{' '}
                  <Link className="underline" href="/logout">
                    Log out
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-accent dark:bg-black rounded-lg p-4">
              <div>
                <p className="mb-4">Enter your email to checkout as a guest.</p>
                <FormItem className="mb-6">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    disabled={!emailEditable}
                    id="email"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </FormItem>
                <Button
                  disabled={!email || !emailEditable}
                  onClick={(e) => {
                    e.preventDefault()
                    setEmailEditable(false)
                  }}
                  variant="default"
                >
                  Continue as guest
                </Button>
              </div>
            </div>
          )}

          <h2 className="font-medium text-3xl">Address</h2>

          {billingAddress ? (
            <div>
              <AddressItem
                actions={
                  <Button
                    variant={'outline'}
                    disabled={isProcessingPayment}
                    onClick={(e) => {
                      e.preventDefault()
                      setBillingAddress(undefined)
                    }}
                  >
                    Remove
                  </Button>
                }
                address={billingAddress}
              />
            </div>
          ) : user ? (
            <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
          ) : (
            <CreateAddressModal
              disabled={!email || Boolean(emailEditable)}
              callback={(address) => setBillingAddress(address)}
              skipSubmission={true}
            />
          )}

          <div className="flex gap-4 items-center">
            <Checkbox
              id="shippingTheSameAsBilling"
              checked={billingAddressSameAsShipping}
              disabled={isProcessingPayment || (!user && (!email || Boolean(emailEditable)))}
              onCheckedChange={(state) => setBillingAddressSameAsShipping(state as boolean)}
            />
            <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
          </div>

          {!billingAddressSameAsShipping && (
            <>
              {shippingAddress ? (
                <div>
                  <AddressItem
                    actions={
                      <Button
                        variant={'outline'}
                        disabled={isProcessingPayment}
                        onClick={(e) => {
                          e.preventDefault()
                          setShippingAddress(undefined)
                        }}
                      >
                        Remove
                      </Button>
                    }
                    address={shippingAddress}
                  />
                </div>
              ) : user ? (
                <CheckoutAddresses
                  heading="Shipping address"
                  description="Please select a shipping address."
                  setAddress={setShippingAddress}
                />
              ) : (
                <CreateAddressModal
                  callback={(address) => setShippingAddress(address)}
                  disabled={!email || Boolean(emailEditable)}
                  skipSubmission={true}
                />
              )}
            </>
          )}

          <Button
            className="self-start"
            disabled={!canPay || isProcessingPayment}
            onClick={(e) => {
              e.preventDefault()
              void initiatePaymentIntent()
            }}
          >
            {isProcessingPayment ? 'Processing Payment...' : 'Pay with Paystack'}
          </Button>

          {canGoToPayment && typeof shippingFee !== 'number' && (
            <div className="my-2">
              <Message error={shippingFeeResult.error} />
            </div>
          )}

          {error && (
            <div className="my-8">
              <Message error={error} />
              {/* <Button
                onClick={(e) => {
                  e.preventDefault()
                  router.refresh()
                }}
                variant="default"
                disabled={isProcessingPayment}
              >
                Try again
              </Button> */}
            </div>
          )}
        </div>

        {!cartIsEmpty && (
          <div className="basis-full lg:basis-1/3 lg:pl-8 p-8 border-none bg-primary/5 flex flex-col gap-8 rounded-lg">
            <h2 className="text-3xl font-medium">Your cart</h2>
            {(cart as Cart)?.items?.map((item, index) => {
              if (typeof item.product === 'object' && item.product) {
                const {
                  product,
                  product: { id, meta, title, gallery },
                  quantity,
                  variant,
                } = item

                if (!quantity) return null

                let image = gallery?.[0]?.image || meta?.image
                let price: number | null = null

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

                  if (imageVariant && typeof imageVariant.image !== 'string') {
                    image = imageVariant.image
                  }
                }

                if (!isVariant) {
                  price = getEffectivePrice(product as any, currency.code).price
                }

                return (
                  <div className="flex items-start gap-4" key={index}>
                    <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                      <div className="relative w-full h-full">
                        {image && typeof image !== 'string' && (
                          <Media className="" fill imgClassName="rounded-lg" resource={image} />
                        )}
                      </div>
                    </div>
                    <div className="flex grow justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-lg">{title}</p>
                        {variant && typeof variant === 'object' && (
                          <p className="text-sm font-mono text-primary/50 tracking-widest">
                            {variant.options
                              ?.map((option) => {
                                if (typeof option === 'object') return option.label
                                return null
                              })
                              .join(', ')}
                          </p>
                        )}
                        <div>
                          {'x'}
                          {quantity}
                        </div>
                      </div>
                      {typeof price === 'number' && <Price amount={price} />}
                    </div>
                  </div>
                )
              }
              return null
            })}

            <hr />

            {/* ── Discount code section ── */}
            <div className="flex flex-col gap-3">
              <Label htmlFor="discount-code">Discount code</Label>
              <div className="flex gap-2">
                <Input
                  id="discount-code"
                  placeholder="Enter code"
                  value={discountCode}
                  disabled={applyDiscountLoading}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!discountCode || !cart?.id || applyDiscountLoading}
                  onClick={(e) => {
                    e.preventDefault()
                    void applyDiscount()
                  }}
                >
                  {applyDiscountLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Applying…
                    </span>
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              {discountError && <p className="text-sm text-red-500">{discountError}</p>}
            </div>

            <hr />

            <div className="flex justify-between items-center gap-2">
              {typeof discountAmount === 'number' && discountAmount > 0 && (
                <span className="uppercase text-sm">Discount</span>
              )}
              {typeof discountAmount === 'number' && discountAmount > 0 && (
                <Price className="text-lg font-medium" amount={discountAmount} />
              )}
            </div>
            {typeof shippingFee === 'number' && (
              <div className="flex justify-between items-center gap-2">
                <span className="uppercase text-sm">Shipping</span>
                <Price className="text-lg font-medium" amount={shippingFee} />
              </div>
            )}
            <div className="flex justify-between items-center gap-2">
              <span className="uppercase">Total</span>
              <Price className="text-3xl font-medium" amount={grandTotal} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
