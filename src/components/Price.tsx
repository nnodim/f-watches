'use client'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useMemo } from 'react'

type BaseProps = {
  className?: string
  currencyCodeClassName?: string
  as?: 'span' | 'p'
}

type PriceFixed = {
  amount: number
  currencyCode?: string
  highestAmount?: never
  lowestAmount?: never
}

type PriceRange = {
  amount?: never
  currencyCode?: string
  highestAmount: number
  lowestAmount: number
}

type Props = BaseProps & (PriceFixed | PriceRange)

export const Price = ({
  amount,
  className,
  highestAmount,
  lowestAmount,
  currencyCode: currencyCodeFromProps,
  as = 'p',
}: Props & React.ComponentProps<'p'>) => {
  const { supportedCurrencies } = useCurrency() // We don't need formatCurrency anymore

  const Element = as

  const currencyToUse = useMemo(() => {
    if (currencyCodeFromProps) {
      return supportedCurrencies.find((currency) => currency.code === currencyCodeFromProps)
    }
    // Fallback to the first available currency or handle undefined
    return supportedCurrencies?.[0]
  }, [currencyCodeFromProps, supportedCurrencies])

  // --- NEW CUSTOM FORMATTER ---
  const customFormat = (value: number) => {
    if (!currencyToUse) return value.toString()

    // 1. Convert base units (cents) to decimals (dollars)
    const decimalValue = value / Math.pow(10, currencyToUse.decimals)

    // 2. Format with commas using toLocaleString
    // 'en-US' ensures commas are used for thousands. You can change this locale.
    const formattedNumber = decimalValue.toLocaleString('en-US', {
      minimumFractionDigits: currencyToUse.decimals,
      maximumFractionDigits: currencyToUse.decimals,
    })

    return `${currencyToUse.symbol}${formattedNumber}`
  }

  if (typeof amount === 'number') {
    return (
      <Element className={className} suppressHydrationWarning>
        {customFormat(amount)}
      </Element>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    return (
      <Element className={className} suppressHydrationWarning>
        {`${customFormat(lowestAmount)} - ${customFormat(highestAmount)}`}
      </Element>
    )
  }

  if (lowestAmount) {
    return (
      <Element className={className} suppressHydrationWarning>
        {customFormat(lowestAmount)}
      </Element>
    )
  }

  return null
}
