import type { DefaultServerCellComponentProps } from 'payload'
import React from 'react'
import { ItemsPreview, PreviewItem } from './ItemsPreview'
import { formatMinor } from './format'

const idOf = (v: unknown): string | null =>
  v && typeof v === 'object' ? ((v as any).id ?? null) : v != null ? String(v) : null

/** Pick the best small image URL from a media doc. */
function mediaUrl(media: any): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  return media.sizes?.thumbnail?.url ?? media.thumbnailURL ?? media.url ?? undefined
}

/**
 * ASSUMPTION: adjust this to match your products schema.
 * Order of lookup: first gallery image -> SEO meta image -> a top-level `image`.
 */
function productImage(product: any): string | undefined {
  return (
    mediaUrl(product?.gallery?.[0]?.image) ??
    mediaUrl(product?.gallery?.[0]) ??
    mediaUrl(product?.meta?.image) ??
    mediaUrl(product?.image)
  )
}

function variantLabel(variant: any): string | undefined {
  if (!variant || typeof variant !== 'object') return undefined
  if (variant.title) return variant.title
  const opts = (variant.options ?? [])
    .map((o: any) => (typeof o === 'object' ? (o.label ?? o.value) : null))
    .filter(Boolean)
  return opts.length ? opts.join(' / ') : undefined
}

export async function ItemsPreviewCell({ rowData, payload }: DefaultServerCellComponentProps) {
  const items: any[] = Array.isArray(rowData?.items) ? rowData.items : []
  if (items.length === 0) return <span style={{ opacity: 0.5 }}>—</span>

  const productIDs = [...new Set(items.map((i) => idOf(i.product)).filter(Boolean))] as string[]
  const variantIDs = [...new Set(items.map((i) => idOf(i.variant)).filter(Boolean))] as string[]

  const [productsRes, variantsRes] = await Promise.all([
    productIDs.length
      ? payload.find({
          collection: 'products',
          where: { id: { in: productIDs } },
          depth: 1,
          pagination: false,
        })
      : { docs: [] as any[] },
    variantIDs.length
      ? payload.find({
          collection: 'variants',
          where: { id: { in: variantIDs } },
          depth: 1,
          pagination: false,
        })
      : { docs: [] as any[] },
  ])

  const products = new Map<string, any>((productsRes.docs as any[]).map((p) => [String(p.id), p]))
  const variants = new Map<string, any>((variantsRes.docs as any[]).map((v) => [String(v.id), v]))
  const currency = rowData?.currency

  const preview: PreviewItem[] = items.map((item, index) => {
    const product = products.get(idOf(item.product) ?? '')
    const variant = variants.get(idOf(item.variant) ?? '')
    const quantity = Number(item.quantity) || 1
    const unit = typeof item.unitPrice === 'number' ? item.unitPrice : undefined

    return {
      key: item.id ?? `${index}`,
      name: product?.title ?? product?.name ?? 'Deleted product',
      variant: variantLabel(variant),
      quantity,
      imageUrl: productImage(variant) ?? productImage(product),
      unitPrice: unit !== undefined ? formatMinor(unit, currency) : undefined,
      lineTotal: unit !== undefined ? formatMinor(unit * quantity, currency) : undefined,
    }
  })

  return (
    <ItemsPreview
      orderID={String(rowData.id)}
      customerEmail={rowData.customerEmail}
      items={preview}
    />
  )
}

export default ItemsPreviewCell
