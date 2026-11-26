import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import clsx from 'clsx'
import { FacetItem } from './FacetItem'

export function FacetSection({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <h3 className="text-xs mb-2 text-neutral-500 dark:text-neutral-400">{title}</h3>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  )
}

export function FacetFallback({ value, title }: { value: string; title: string }) {
  const bar = 'mb-3 h-4 animate-pulse rounded bg-neutral-400 dark:bg-neutral-700'
  return (
    <FacetSection value={value} title={title}>
      <div className="py-2">
        <div className={clsx(bar, 'w-5/6')} />
        <div className={clsx(bar, 'w-4/6')} />
        <div className={clsx(bar, 'w-3/6')} />
      </div>
    </FacetSection>
  )
}

/** Facet whose options come from config (movement, material, case size). */
export function StaticFacet({
  value,
  title,
  param,
  options,
  multi = true,
}: {
  value: string
  title: string
  param: string
  options: { label: string; value: string }[]
  multi?: boolean
}) {
  return (
    <FacetSection value={value} title={title}>
      <ul>
        {options.map((o) => (
          <li key={o.value}>
            <FacetItem param={param} value={o.value} label={o.label} multi={multi} />
          </li>
        ))}
      </ul>
    </FacetSection>
  )
}
