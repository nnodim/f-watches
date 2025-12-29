import { Card, CardHeader } from '@/components/ui/card'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Media } from '@/components/Media'
import clsx from 'clsx'

export default async function CollectionsSection() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
  })

  return (
    <section className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Collections
          </h2>

          <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:space-y-0">
            {categories.docs.map((category) => (
              <Card key={category.id} className="group relative overflow-hidden rounded-lg">
                {/* Image container with hover effect */}
                <div className="relative h-80 w-full overflow-hidden sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 sm:h-auto">
                  {category?.gallery ? (
                    <Media
                      className={clsx(
                        'relative aspect-square object-cover border bg-primary-foreground',
                      )}
                      height={80}
                      imgClassName={clsx(
                        'h-full w-full object-cover transition duration-1000 ease-in-out group-hover:scale-105',
                      )}
                      resource={category.gallery[0]}
                      width={80}
                    />
                  ) : null}
                </div>

                <CardHeader className="mt-2">
                  <h3 className="text-foreground">
                    <Link href={`/shop/${category.slug}`} className="focus:outline-hidden">
                      {/* This span makes the entire card clickable */}
                      <span className="absolute inset-0" aria-hidden="true" />
                      {category.title}
                    </Link>
                  </h3>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
