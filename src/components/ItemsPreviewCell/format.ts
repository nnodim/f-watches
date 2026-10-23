import { currenciesConfig } from '@/lib/constants'

function findCurrency(code?: string | null) {
  const list = currenciesConfig.supportedCurrencies
  return (
    list.find((c) => c.code === code) ??
    list.find((c) => c.code === currenciesConfig.defaultCurrency) ??
    list[0]
  )
}

/** Number of decimal places for a currency (amounts are stored in minor units). */
export function getDecimals(code?: string | null): number {
  return findCurrency(code)?.decimals ?? 2
}

/** Format a minor-unit amount (kobo/cents) for display. */
export function formatMinor(amount: number | null | undefined, code?: string | null): string {
  const currency = findCurrency(code)
  const decimals = currency?.decimals ?? 2
  const value = (amount ?? 0) / 10 ** decimals

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency?.code ?? code ?? 'NGN',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  } catch {
    return `${currency?.symbol ?? ''}${value.toFixed(decimals)}`
  }
}
