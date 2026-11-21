import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { ClipReveal } from '@/components/motion/ClipReveal'
import { MaskText } from '@/components/motion/MaskText'
import { Parallax } from '@/components/motion/Parallax'
import { Reveal } from '@/components/motion/Reveal'
import type { BrandGridBlock as Props } from '@/payload-types'
import React from 'react'

export const BrandGridBlock: React.FC<Props> = ({ heading, brands }) => {
  if (!brands?.length) return null

  return (
    <section className="container py-24">
      {heading && (
        <MaskText as="h2" className="mb-14 text-center text-4xl font-light tracking-tight md:text-5xl">
          {heading}
        </MaskText>
      )}
      <div className="grid gap-10 md:grid-cols-2">
        {brands.map((brand, i) => (
          <article key={brand.id ?? i} className="relative flex flex-col gap-5">
            <ClipReveal mode="up" className="aspect-[16/11]">
              <Parallax className="absolute inset-0">
                <Media fill resource={brand.image} imgClassName="object-cover" />
              </Parallax>
            </ClipReveal>
            <Reveal className="flex flex-col gap-3">
              <h3 className="text-3xl font-light tracking-tight">{brand.name}</h3>
              {brand.description && (
                <p className="max-w-md leading-relaxed text-muted-foreground">{brand.description}</p>
              )}
              <CMSLink
                {...brand.link}
                appearance="inline"
                className="w-fit border-b border-primary pb-1 text-xs uppercase tracking-[0.2em] after:absolute after:inset-0 after:content-['']"
              />
            </Reveal>
          </article>
        ))}
      </div>
    </section>
  )
}
