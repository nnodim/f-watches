import { USD } from "@payloadcms/plugin-ecommerce"
import { CurrenciesConfig, Currency } from "@payloadcms/plugin-ecommerce/types"

export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'priceInNGN', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: '-priceInNGN', reverse: true, title: 'Price: High to low' },
]

export const defaultCategoryContent: Record<
  string,
  { title: string; description: string; image: string }
> = {
  all: {
    title: 'All Products',
    description: 'Browse our complete collection of watches — from luxury to casual styles.',
    image: '/images/hero-img.jpg',
  },
  'new-arrival': {
    title: 'New Arrivals',
    description: 'Discover our newest timepieces, fresh from the latest collections.',
    image: '/images/hero-img.jpg',
  },
  featured: {
    title: 'Featured Products',
    description: 'Handpicked watches that define our most popular and stylish selections.',
    image: '/images/hero-img.jpg',
  },
  sale: {
    title: 'Sale Items',
    description: 'Exclusive discounts on select timepieces. Grab your favorite while stock lasts!',
    image: '/images/hero-img.jpg',
  },
  search: {
    title: 'Search Results',
    description: 'Your search results.',
    image: '/images/hero-img.jpg',
  },
}

export const NGN: Currency = {
  code: 'NGN',
  decimals: 2,
  label: 'Naira',
  symbol: '₦',
}

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'NGN',
  supportedCurrencies: [NGN, USD],
}

