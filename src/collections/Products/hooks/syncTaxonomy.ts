import type { CollectionBeforeChangeHook } from 'payload'

const toID = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return typeof value.id === 'string' ? value.id : undefined
  }
  return undefined
}

export const syncTaxonomy: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const hasField = (field: 'brand' | 'watchCollection' | 'watchModel') =>
    Object.prototype.hasOwnProperty.call(data, field)
  const hasBrand = hasField('brand')
  const hasWatchCollection = hasField('watchCollection')
  const hasWatchModel = hasField('watchModel')

  if (!hasBrand && !hasWatchCollection && !hasWatchModel) return data

  const brandID = toID(hasBrand ? data.brand : originalDoc?.brand)
  let watchCollectionID = toID(
    hasWatchCollection ? data.watchCollection : originalDoc?.watchCollection,
  )
  let watchModelID = toID(hasWatchModel ? data.watchModel : originalDoc?.watchModel)

  if (hasBrand && !brandID) {
    data.watchCollection = null
    data.watchModel = null
    return data
  }

  if (hasWatchCollection && !watchCollectionID) {
    data.watchModel = null
    return data
  }

  let modelCollectionID: string | undefined
  if (watchModelID) {
    const model = await req.payload.findByID({
      collection: 'watchModels',
      id: watchModelID,
      depth: 0,
      req,
    })
    modelCollectionID = toID(model.watchCollection)
    if (!modelCollectionID) throw new Error('Watch model must be linked to a watch collection')
  }

  if (hasWatchModel && !watchModelID) {
    data.watchModel = null
  } else if (hasWatchModel && modelCollectionID) {
    watchCollectionID = modelCollectionID
    data.watchCollection = watchCollectionID
  } else if (
    hasWatchCollection &&
    watchCollectionID &&
    watchModelID &&
    modelCollectionID !== watchCollectionID
  ) {
    watchModelID = undefined
    data.watchModel = null
  }

  if (watchCollectionID) {
    const col = await req.payload.findByID({
      collection: 'watchCollections',
      id: watchCollectionID,
      depth: 0,
      req,
    })
    const brand = toID(col.brand)
    if (!brand) throw new Error('Watch collection must be linked to a brand')

    if (hasBrand && brandID && brandID !== brand && !hasWatchCollection && !hasWatchModel) {
      data.watchCollection = null
      data.watchModel = null
      return data
    }

    data.brand = brand
  }

  return data
}
