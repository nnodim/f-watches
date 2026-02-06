import configPromise from '@payload-config'
import { getPayload, Where } from 'payload'

import { Grid } from '@/components/Grid'
import { Pagination } from '@/components/Pagination'
import { ProductGridItem } from '@/components/ProductGridItem'
import Categories from '@/components/layout/search/Categories'
import Models from '@/components/layout/search/Models'
import { FilterList } from '@/components/layout/search/filter'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { sorting } from '@/lib/constants'

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

async function page({ searchParams, params }: Props) {
  const { q: searchValue, sort, category: categoryId, model, page: pageParam } = await searchParams
  const { slug } = await params

  const currentPage = pageParam ? parseInt(pageParam as string) : 1
  const ITEMS_PER_PAGE = 12

  const payload = await getPayload({ config: configPromise })

  const whereConditions: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  // Add search condition if it exists
  if (searchValue) {
    whereConditions.push({
      or: [{ title: { like: searchValue } }, { description: { like: searchValue } }],
    })
  }

  // Add model condition if it exists
  if (model) {
    whereConditions.push({
      model: {
        equals: model,
      },
    })
  }

  if (categoryId) {
    whereConditions.push({
      categories: {
        contains: categoryId,
      },
    })
  } else {
    if (slug === 'new-arrival') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      whereConditions.push({
        createdAt: {
          greater_than: thirtyDaysAgo.toISOString(),
        },
      })
    } else if (slug === 'featured') {
      whereConditions.push({
        isFeatured: {
          equals: true,
        },
      })
    } else if (slug === 'sale') {
      whereConditions.push({
        isOnSale: {
          equals: true,
        },
      })
    } else if (slug !== 'all' && slug !== 'search') {
      whereConditions.push({
        'categories.slug': {
          equals: slug,
        },
      })
    }
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInNGN: true,
    },
    sort: (sort as string) || '-createdAt',
    where: {
      and: whereConditions,
    },
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div className="container flex flex-col md:flex-row items-start justify-between gap-16 md:gap-10 mt-8">
      {/* --- SIDEBAR START --- */}
      <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
        <Accordion defaultValue="item-1" type="single" collapsible>
          <AccordionItem value="item-1">
            <Categories currentSlug={slug} />
          </AccordionItem>
          <AccordionItem value="item-2">
            <Models
              currentSlug={slug}
              categoryId={Array.isArray(categoryId) ? categoryId[0] : categoryId}
            />
          </AccordionItem>
          <AccordionItem value="item-3">
            <FilterList list={sorting} title="Sort by" />
          </AccordionItem>
        </Accordion>
      </div>
      {/* --- SIDEBAR END --- */}

      {/* --- PRODUCT GRID START --- */}
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
            <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.docs.map((product) => {
                return <ProductGridItem key={product.id} product={product} />
              })}
            </Grid>

            {/* Add Pagination */}
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
