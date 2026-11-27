'use client'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Props = {
  param: string
  value: string
  label: string
  multi?: boolean
  clears?: string[]
}

export function FacetItem({ param, value, label, multi = false, clears = [] }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = searchParams.get(param)?.split(',').filter(Boolean) ?? []
  const isActive = current.includes(value)

  const toggle = () => {
    const params = new URLSearchParams(searchParams.toString())

    const next = multi
      ? isActive
        ? current.filter((v) => v !== value)
        : [...current, value]
      : isActive
        ? []
        : [value]

    if (next.length) params.set(param, next.join(','))
    else params.delete(param)

    clears.forEach((p) => params.delete(p))
    params.delete('page')

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={isActive}
      className={clsx(
        'mt-2 w-full text-left text-sm hover:cursor-pointer hover:underline hover:underline-offset-4',
        { 'underline underline-offset-4 font-medium': isActive },
      )}
    >
      {label}
    </button>
  )
}
