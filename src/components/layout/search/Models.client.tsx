'use client'
import React, { useCallback, useMemo } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  model: string
}

export const ModelItem: React.FC<Props> = ({ model }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('model') === model
  }, [searchParams, model])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('model')
    } else {
      params.set('model', model)
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [isActive, model, pathname, router, searchParams])

  return (
    <button
      onClick={() => setQuery()}
      className={clsx(
        'mt-2 w-full text-left text-sm hover:cursor-pointer hover:underline hover:underline-offset-4',
        {
          'underline underline-offset-4': isActive,
        },
      )}
    >
      {model}
    </button>
  )
}
