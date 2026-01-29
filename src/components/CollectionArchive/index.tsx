import { cn } from '@/utilities/cn'
import React from 'react'

import type { Post, Search } from '@/payload-types'
import { Card } from '../Card'

export type Props = {
  posts: Post[] | Search[]
  isSearchResults?: boolean
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts, isSearchResults = false } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              if (isSearchResults && 'doc' in result) {
                const searchResult = result as Search
                const relationTo = searchResult.doc.relationTo
                return (
                  <div className="col-span-4" key={index}>
                    <Card
                      className="h-full"
                      doc={result as Search}
                      relationTo={relationTo}
                      showCategories
                      showBadge
                    />
                  </div>
                )
              }

              return (
                <div className="col-span-4" key={index}>
                  <Card className="h-full" doc={result as Post} relationTo="posts" showCategories />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
