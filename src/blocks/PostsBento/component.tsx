import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { PostsBentoBlock as PostsBentoBlockProps, Post } from '@/payload-types'
import { BentoGrid, type BentoPost } from './client'
import { MaskText } from '@/components/motion/MaskText'

export const PostsBentoBlock: React.FC<PostsBentoBlockProps> = async ({
  heading,
  populateBy,
  categories,
  limit,
  selectedPosts,
}) => {
  const payload = await getPayload({ config: configPromise })
  let docs: Post[] = []

  if (populateBy === 'selection' && selectedPosts?.length) {
    const ids = selectedPosts.map((p) => (typeof p === 'object' ? p.id : p))
    const res = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 8,
      pagination: false,
      where: { id: { in: ids } },
    })
    docs = ids.map((id) => res.docs.find((d) => d.id === id)).filter(Boolean) as Post[]
  } else {
    const catIds = categories?.map((c) => (typeof c === 'object' ? c.id : c))
    const res = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: Math.min(limit || 8, 8),
      pagination: false,
      sort: '-publishedAt',
      where: catIds?.length ? { categories: { in: catIds } } : undefined,
    })
    docs = res.docs
  }

  const posts: BentoPost[] = docs
    .map((p) => {
      const image = p.heroImage ?? p.meta?.image
      const cat = p.categories?.[0]
      return {
        id: p.id,
        slug: p.slug as string,
        title: p.title,
        category: cat && typeof cat === 'object' ? (cat.title ?? null) : null,
        date: p.publishedAt ?? null,
        image: image && typeof image === 'object' ? image : null,
      }
    })
    .filter((p) => p.slug)

  if (!posts.length) return null

  return (
    <section className="md:py-16">
      {heading && (
        <MaskText
          as="h2"
          className="mb-14 text-center text-4xl font-light tracking-tight md:text-5xl"
        >
          {heading}
        </MaskText>
      )}
      <BentoGrid posts={posts} />
    </section>
  )
}
