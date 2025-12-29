import type { SortFilterItem } from '@/lib/constants'

import React, { Suspense } from 'react'
import { FilterItemDropdown } from './FilterItemDropdown'
import { FilterItem } from './FilterItem'
import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion'

export type ListItem = PathFilterItem | SortFilterItem
export type PathFilterItem = { path: string; title: string }

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <React.Fragment>
      {list.map((item: ListItem, i) => (
        <FilterItem item={item} key={i} />
      ))}
    </React.Fragment>
  )
}

export function FilterList({ list, title }: { list: ListItem[]; title?: string }) {
  return (
    <React.Fragment>
      <nav>
        {title ? (
          <AccordionTrigger>
            <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">{title}</h3>
          </AccordionTrigger>
        ) : null}
        <AccordionContent>
          <ul className="hidden md:block">
            <Suspense fallback={null}>
              <FilterItemList list={list} />
            </Suspense>
          </ul>
          <ul className="md:hidden">
            <Suspense fallback={null}>
              <FilterItemDropdown list={list} />
            </Suspense>
          </ul>
        </AccordionContent>
      </nav>
    </React.Fragment>
  )
}
