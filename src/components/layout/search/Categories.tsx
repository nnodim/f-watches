import configPromise from '@payload-config'
import clsx from 'clsx'
import { getPayload } from 'payload'
import { Suspense } from 'react'

import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'
import { CategoryItem } from './Categories.client'

async function CategoryList({ currentSlug }: { currentSlug: string }) {
  const payload = await getPayload({ config: configPromise })

  const showAllSlugs = ['all', 'new-arrival', 'featured', 'sale']

  let categories

  if (showAllSlugs.includes(currentSlug)) {
    // For special slugs, show all categories
    categories = await payload.find({
      collection: 'categories',
      sort: 'title',
    })
  } else {
    // For specific category slugs, only show that category
    categories = await payload.find({
      collection: 'categories',
      sort: 'title',
      where: {
        slug: {
          equals: currentSlug,
        },
      },
    })
  }

  if (categories.docs.length === 0) {
    categories = await payload.find({
      collection: 'categories',
      sort: 'title',
    })
  }

  return (
    <div>
      <AccordionTrigger>
        <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Brands</h3>
      </AccordionTrigger>

      <AccordionContent>
        <ul>
          {categories.docs.map((category) => {
            return (
              <li key={category.id}>
                <CategoryItem category={category} />
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

export default function Categories({ currentSlug }: { currentSlug: string }) {
  return (
    <Suspense
      fallback={
        <>
          <AccordionTrigger>
            <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">Brands</h3>
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
      <CategoryList currentSlug={currentSlug} />
    </Suspense>
  )
}
