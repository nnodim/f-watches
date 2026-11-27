'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const FILTER_PARAMS = [
  'category',
  'collection',
  'model',
  'movement',
  'material',
  'caseSize',
  'page',
  'limited',
]

export function ClearFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active = FILTER_PARAMS.some((p) => p !== 'page' && searchParams.has(p))
  if (!active) return null

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_PARAMS.forEach((p) => params.delete(p)) // keeps q and sort
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <button
      onClick={clear}
      className="text-xs text-neutral-500 underline underline-offset-4 hover:text-foreground"
    >
      Clear filters
    </button>
  )
}
