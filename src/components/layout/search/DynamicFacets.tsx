import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Suspense } from 'react'
import { FacetItem } from './FacetItem'
import { FacetFallback, FacetSection } from './FacetSection'

async function BrandList() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    sort: 'title',
    limit: 100,
    depth: 0,
    pagination: false,
  })
  if (!docs.length) return null

  return (
    <FacetSection value="brand" title="Brand">
      <ul>
        {docs.map((c) => (
          <li key={c.id}>
            <FacetItem
              param="category"
              value={String(c.id)}
              label={c.title}
              clears={['collection', 'model']}
            />
          </li>
        ))}
      </ul>
    </FacetSection>
  )
}

export function BrandFacet() {
  return (
    <Suspense fallback={<FacetFallback value="brand" title="Brand" />}>
      <BrandList />
    </Suspense>
  )
}

async function CollectionList({ brandIds }: { brandIds: string[] }) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'watchCollections',
    where: brandIds.length ? { brand: { in: brandIds } } : undefined,
    sort: 'title',
    limit: 100,
    depth: 0,
    pagination: false,
  })
  if (!docs.length) return null

  return (
    <FacetSection value="collection" title="Collection">
      <ul>
        {docs.map((c) => (
          <li key={c.id}>
            <FacetItem param="collection" value={c.slug!} label={c.title} clears={['model']} />
          </li>
        ))}
      </ul>
    </FacetSection>
  )
}

export function CollectionFacet({ brandIds }: { brandIds: string[] }) {
  return (
    <Suspense fallback={<FacetFallback value="collection" title="Collection" />}>
      <CollectionList brandIds={brandIds} />
    </Suspense>
  )
}

async function ModelList({
  brandIds,
  collectionSlugs,
}: {
  brandIds: string[]
  collectionSlugs: string[]
}) {
  if (!brandIds.length && !collectionSlugs.length) return null

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'watchModels',
    where: collectionSlugs.length
      ? { 'watchCollection.slug': { in: collectionSlugs } }
      : { 'watchCollection.brand': { in: brandIds } },
    sort: 'title',
    limit: 200,
    depth: 0,
    pagination: false,
  })
  if (!docs.length) return null

  return (
    <FacetSection value="model" title="Model">
      <ul>
        {docs.map((m) => (
          <li key={m.id}>
            <FacetItem param="model" value={m.slug!} label={m.title} />
          </li>
        ))}
      </ul>
    </FacetSection>
  )
}

export function ModelFacet(props: { brandIds: string[]; collectionSlugs: string[] }) {
  return (
    <Suspense fallback={null}>
      <ModelList {...props} />
    </Suspense>
  )
}
