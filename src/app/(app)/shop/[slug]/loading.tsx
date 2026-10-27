import { Grid } from '@/components/Grid'
import React from 'react'

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading shop"
      className="container mt-8 flex flex-col items-start justify-between gap-16 md:flex-row md:gap-10"
    >
      <div className="flex w-full flex-none basis-1/5 flex-col gap-4 md:gap-8">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="flex h-12 items-center border-b border-neutral-200 dark:border-neutral-800" key={index}>
            <div className="h-4 w-28 animate-pulse rounded-sm bg-neutral-100 dark:bg-neutral-900" />
          </div>
        ))}
      </div>

      <div className="min-h-screen w-full">
        <Grid className="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, index) => (
            <div className="animate-pulse" key={index}>
              <div className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
              <div className="mt-4 flex flex-col-reverse gap-2">
                <div className="h-4 w-3/4 rounded-sm bg-neutral-100 dark:bg-neutral-900" />
                <div className="h-4 w-1/3 rounded-sm bg-neutral-100 dark:bg-neutral-900" />
              </div>
            </div>
          ))}
        </Grid>
      </div>
    </div>
  )
}
