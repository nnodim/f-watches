import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import configPromise from '@payload-config'
import clsx from 'clsx'
import { getPayload, Where } from 'payload'
import { Suspense } from 'react'
import { ModelItem } from './Models.client'

async function ModelList({ categoryId }: { currentSlug: string; categoryId?: string }) {
  const payload = await getPayload({ config: configPromise })

//   const showAllSlugs = ['all', 'new-arrival', 'featured', 'sale']

  // Build the where clause
  const whereClause: Where = {}

  // If we have a specific category, filter by it
  if (categoryId) {
    whereClause.categories = {
      contains: categoryId,
    }
  }

  // Fetch products with the where clause
  const products = await payload.find({
    collection: 'products',
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    limit: 1000, // Adjust as needed
  })

  // Extract unique models from products
  const uniqueModels = Array.from(
    new Set(
      products.docs
        .map((product) => product.model)
        .filter((model): model is string => Boolean(model)),
    ),
  ).sort()

  if (uniqueModels.length === 0) {
    return null
  }

  return (
    <div>
      <AccordionTrigger>
        <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Models</h3>
      </AccordionTrigger>

      <AccordionContent>
        <ul>
          {uniqueModels.map((model) => {
            return (
              <li key={model}>
                <ModelItem model={model} />
              </li>
            )
          })}
        </ul>
      </AccordionContent>
    </div>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export default function Models({
  currentSlug,
  categoryId,
}: {
  currentSlug: string
  categoryId?: string
}) {
  return (
    <Suspense
      fallback={
        <>
          <AccordionTrigger>
            <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Models</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="col-span-2 hidden h-50 w-full flex-none py-4 lg:block">
              <div className={clsx(skeleton, activeAndTitles)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
              <div className={clsx(skeleton, items)} />
            </div>
          </AccordionContent>
        </>
      }
    >
      <ModelList currentSlug={currentSlug} categoryId={categoryId} />
    </Suspense>
  )
}
