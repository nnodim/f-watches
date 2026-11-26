import type { CollectionBeforeChangeHook } from 'payload'

const toID = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return typeof value.id === 'string' ? value.id : undefined
  }
  return undefined
}

export const syncTaxonomy: CollectionBeforeChangeHook = async ({ data, req }) => {
  const watchModelID = toID(data.watchModel)
  if (watchModelID) {
    const model = await req.payload.findByID({
      collection: 'watchModels',
      id: watchModelID,
      depth: 0,
      req,
    })
    const watchCollectionID = toID(model.watchCollection)
    if (!watchCollectionID) throw new Error('Watch model must be linked to a watch collection')
    data.watchCollection = watchCollectionID
  }

  const watchCollectionID = toID(data.watchCollection)
  if (watchCollectionID) {
    const col = await req.payload.findByID({
      collection: 'watchCollections',
      id: watchCollectionID,
      depth: 0,
      req,
    })
    const brand = toID(col.brand)
    if (!brand) throw new Error('Watch collection must be linked to a brand')
    data.brand = brand
  }

  return data
}
