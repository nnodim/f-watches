import { Media, Product } from '@/payload-types'
import Link from 'next/link'
import { GridTileImage } from './Grid/tile'
import { Media as MediaComponent } from '@/components/Media'

export default function RelatedProducts({
  products,
  small = false,
}: {
  products: Product[]
  small?: boolean
}) {
  if (!products.length) return null

  return small === false ? (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {products.map((product) => (
          <li
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            key={product.id}
          >
            <Link className="relative h-full w-full" href={`/products/${product.slug}`}>
              <GridTileImage
                label={{
                  amount: product.priceInNGN!,
                  title: product.title,
                }}
                media={product.meta?.image as Media}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {products.map((product) => (
          <li className="aspect-square flex-none w-20" key={product.id}>
            <Link className="relative h-full w-full" href={`/products/${product.slug}`}>
              <MediaComponent
                imgClassName={'w-full h-full object-cover border rounded-lg'}
                resource={product.meta?.image as Media}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
