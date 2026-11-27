import configPromise from '@payload-config'
import { getPayload, Where } from 'payload'

import { Grid } from '@/components/Grid'
import { Pagination } from '@/components/Pagination'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ClearFilters } from '@/components/layout/search/ClearFilters'
import { BrandFacet, CollectionFacet, ModelFacet } from '@/components/layout/search/DynamicFacets'
import { StaticFacet } from '@/components/layout/search/FacetSection'
import { FilterList } from '@/components/layout/search/filter'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { caseMaterialOptions, caseSizeRanges, movementOptions, sorting } from '@/lib/constants'

export const metadata = {
  description:
    'Discover our extensive collection of watches, featuring the latest styles and timeless classics. Shop now for the perfect timepiece that suits your taste.',
  title: 'Shop all Watches at Fwatches  Styles for Everyone',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
  params: Promise<{ slug: string }>
}

const RESERVED_SLUGS = ['all', 'search', 'new-arrival', 'featured', 'sale', 'limited-edition']

const toArray = (v?: string | string[]) =>
  (Array.isArray(v) ? v : [v ?? ''])
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean)

async function page({ searchParams, params }: Props) {
  const {
    q: searchValue,
    sort,
    category,
    collection,
    model,
    movement,
    material,
    caseSize,
    limited,
    page: pageParam,
  } = await searchParams
  const { slug } = await params

  const currentPage = pageParam ? parseInt(pageParam as string) : 1
  const ITEMS_PER_PAGE = 12

  const brandIds = toArray(category)
  const collectionSlugs = toArray(collection)
  const modelSlugs = toArray(model)

  const payload = await getPayload({ config: configPromise })

  // Sidebar narrowing: brand from ?category=, or from the path (/shop/casio)
  let facetBrandIds = brandIds
  if (!facetBrandIds.length && !RESERVED_SLUGS.includes(slug)) {
    const res = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      pagination: false,
    })
    if (res.docs[0]) facetBrandIds = [String(res.docs[0].id)]
  }

  const whereConditions: Where[] = [
    {
      _status: { equals: 'published' },
      inventory: { greater_than: 0 },
    },
  ]

  if (searchValue) {
    whereConditions.push({
      or: [{ title: { like: searchValue } }, { description: { like: searchValue } }],
    })
  }

  // Apply an explicit brand independently from the listing mode.
  if (brandIds.length) {
    whereConditions.push({ brand: { in: brandIds } })
  }

  if (slug === 'limited-edition' || limited === 'true') {
    whereConditions.push({ isLimitedEdition: { equals: true } })
  }

  if (slug === 'new-arrival') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    whereConditions.push({ createdAt: { greater_than: thirtyDaysAgo.toISOString() } })
  } else if (slug === 'featured') {
    whereConditions.push({ isFeatured: { equals: true } })
  } else if (slug === 'sale') {
    whereConditions.push({ isOnSale: { equals: true } })
  } else if (!brandIds.length && !RESERVED_SLUGS.includes(slug)) {
    whereConditions.push({ 'brand.slug': { equals: slug } })
  }

  // Collection / model (slugs)
  if (collectionSlugs.length) {
    whereConditions.push({ 'watchCollection.slug': { in: collectionSlugs } })
  }
  if (modelSlugs.length) {
    whereConditions.push({ 'watchModel.slug': { in: modelSlugs } })
  }

  // Specs
  const movements = toArray(movement)
  if (movements.length) whereConditions.push({ 'specs.movement': { in: movements } })

  const materials = toArray(material)
  if (materials.length) whereConditions.push({ 'specs.caseMaterial': { in: materials } })

  const selectedSizes = toArray(caseSize)
  const sizeRanges = caseSizeRanges.filter((r) => selectedSizes.includes(r.label))
  if (sizeRanges.length) {
    whereConditions.push({
      or: sizeRanges.map((r) => ({
        and: [
          { 'specs.caseSize': { greater_than_equal: r.min } },
          { 'specs.caseSize': { less_than_equal: r.max } },
        ],
      })),
    })
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: (sort as string) || '-createdAt',
    where: { and: whereConditions },
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div className="container flex flex-col md:flex-row items-start justify-between gap-16 md:gap-10 mt-8">
      <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
        <ClearFilters />

        <Accordion type="multiple" defaultValue={['brand', 'collection', 'model', 'movement']}>
          <BrandFacet />
          <CollectionFacet brandIds={facetBrandIds} />
          <ModelFacet brandIds={facetBrandIds} collectionSlugs={collectionSlugs} />

          <StaticFacet
            value="movement"
            title="Movement"
            param="movement"
            options={movementOptions}
          />
          <StaticFacet
            value="material"
            title="Case material"
            param="material"
            options={caseMaterialOptions}
          />
          <StaticFacet
            value="size"
            title="Case size"
            param="caseSize"
            options={caseSizeRanges.map((r) => ({ label: r.label, value: r.label }))}
          />

          <AccordionItem value="sort">
            <FilterList list={sorting} title="Sort by" />
          </AccordionItem>
        </Accordion>
      </div>

      <div className="min-h-screen w-full">
        {searchValue ? (
          <p className="mb-4">
            {products.docs?.length === 0
              ? 'There are no products that match '
              : `Showing ${products.docs.length} ${resultsText} for `}
            <span className="font-bold">&quot;{searchValue}&quot;</span>
          </p>
        ) : null}

        {!searchValue && products.docs?.length === 0 && (
          <p className="mb-4">No products found. Please try different filters.</p>
        )}

        {products?.docs.length > 0 ? (
          <>
            <Grid className="grid grid-cols-2 gap-0! lg:grid-cols-3 border-t border-l border-foreground">
              {products.docs.map((product) => (
                <ProductGridItem key={product.id} product={product} />
              ))}
            </Grid>

            {products.totalPages > 1 && (
              <Pagination
                page={products.page ?? 1}
                totalPages={products.totalPages}
                useQueryParams={true}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default page
