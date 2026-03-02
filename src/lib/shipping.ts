export type CurrencyCode = 'NGN' | 'USD' | string

type ShippingFeeResult =
  | { amount: number; currency: CurrencyCode }
  | { amount: null; currency: CurrencyCode; error: string }

type ShippingArgs = {
  city?: null | string
  country?: null | string
  currency: CurrencyCode
  state?: null | string
}

const normalize = (value?: null | string) => (value || '').trim().toLowerCase()

const normalizeState = (value?: null | string) => {
  const normalized = normalize(value).replace(/\s+state$/g, '')

  if (
    normalized === 'fct' ||
    normalized === 'f.c.t' ||
    normalized === 'federal capital territory' ||
    normalized === 'abuja federal capital territory'
  ) {
    return 'fct'
  }

  return normalized
}

const normalizeCity = (value?: null | string) => {
  const normalized = normalize(value)

  if (normalized === 'abuja') {
    // country-state-city often returns "Abuja" for FCT
    return 'abuja municipal area council'
  }

  return normalized
}

// Key format: "<state>::<city>"
const NIGERIA_STATE_CITY_FEES: Record<string, Partial<Record<'NGN' | 'USD', number>>> = {
  'lagos::ikeja': { NGN: 250000 },
  'lagos::lekki': { NGN: 300000 },
  'fct::abuja municipal area council': { NGN: 280000 },
  'rivers::port harcourt': { NGN: 350000 },
}

const NIGERIA_STATE_DEFAULT_FEES: Record<string, Partial<Record<'NGN' | 'USD', number>>> = {
  lagos: { NGN: 300000 },
  fct: { NGN: 300000 },
  rivers: { NGN: 350000 },
}

const DEFAULT_NIGERIA_FEE: Partial<Record<'NGN' | 'USD', number>> = {
  NGN: 400000,
}

export function getNigeriaShippingFee(args: ShippingArgs): ShippingFeeResult {
  const { city, country, currency, state } = args

  if (normalize(country) !== 'ng') {
    return {
      amount: null,
      currency,
      error: 'Only Nigeria shipping is supported at the moment.',
    }
  }

  if (!state || !state.trim()) {
    return {
      amount: null,
      currency,
      error: 'Shipping state is required to calculate shipping fee.',
    }
  }

  if (!city || !city.trim()) {
    return {
      amount: null,
      currency,
      error: 'Shipping city is required to calculate shipping fee.',
    }
  }

  const stateKey = normalizeState(state)
  const cityKey = normalizeCity(city)
  const byStateCity = NIGERIA_STATE_CITY_FEES[`${stateKey}::${cityKey}`]

  if (byStateCity) {
    const amount = byStateCity[currency as 'NGN' | 'USD']
    if (typeof amount === 'number') return { amount, currency }
  }

  const byState = NIGERIA_STATE_DEFAULT_FEES[stateKey]
  if (byState) {
    const amount = byState[currency as 'NGN' | 'USD']
    if (typeof amount === 'number') return { amount, currency }
  }

  const fallback = DEFAULT_NIGERIA_FEE[currency as 'NGN' | 'USD']
  if (typeof fallback === 'number') return { amount: fallback, currency }

  return {
    amount: null,
    currency,
    error: `Shipping fee is not configured for ${state}, ${city} (${currency}).`,
  }
}
