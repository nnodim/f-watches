import { defaultCategoryContent } from '@/lib/constants'
import { Search } from '@/components/Search'
import React, { Suspense } from 'react'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { RichText } from '@/components/RichText'
import { Media } from '@/components/Media'
import { PatternBackground } from '@/components/PatternBackground'

const queryCategoryBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'categories',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const categoryResult = await queryCategoryBySlug({ slug })

  const defaultCategory = defaultCategoryContent[slug]
  const title = categoryResult?.title || defaultCategory?.title
  const description = categoryResult?.description || defaultCategory?.description
  const heroImage =
    (categoryResult?.gallery &&
      typeof categoryResult.gallery === 'object' &&
      categoryResult.gallery[0]) ||
    defaultCategory?.image

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col my-16 pb-4">
        <div className="container mb-4">
          <Search />
        </div>

        {/* Category Hero Section */}
        <div className="relative flex items-center justify-center text-white" data-theme="dark">
          <div className="container mb-8 z-10 relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 max-w-146 md:text-center">
              <h1 className="payload-richtext text-[36px] md:text-6xl mx-auto prose md:prose-md dark:prose-invert font-bitcount-grid bold">
                {title}
              </h1>

              {description &&
                (typeof description === 'string' ? (
                  <p className="text-lg text-gray-300 text-center">{description}</p>
                ) : (
                  <RichText className="mb-6" data={description} enableGutter={false} />
                ))}
            </div>
          </div>

          {/* Category Hero Image */}
          <div className="min-h-[80vh] select-none">
            <div className="absolute inset-0 bg-black opacity-50 h-full w-full"></div>
            {typeof heroImage === 'string' ? (
              <PatternBackground
                density={30}
                opacity={0.8}
                images={[
                  { src: '/images/F.png', width: 90 },
                  { src: '/images/W.png', width: 110 },
                  { src: '/images/A.png', width: 70 },
                  { src: '/images/T.png', width: 70 },
                  { src: '/images/C.png', width: 70 },
                  { src: '/images/H.png', width: 70 },
                  { src: '/images/E.png', width: 70 },
                  { src: '/images/S.png', width: 70 },
                ]}
              />
            ) : (
              <Media fill imgClassName="-z-10 object-cover" priority resource={heroImage} />
            )}
          </div>
        </div>
        {children}
      </div>
    </Suspense>
  )
}
