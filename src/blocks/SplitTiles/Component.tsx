import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { ClipReveal } from '@/components/motion/ClipReveal'
import { Parallax } from '@/components/motion/Parallax'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import type { SplitTilesBlock as Props } from '@/payload-types'
import React from 'react'

export const SplitTilesBlock: React.FC<Props> = ({ tiles }) => {
  if (!tiles?.length) return null

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {tiles.map((tile, i) => (
        <ClipReveal
          key={tile.id ?? i}
          mode="frame"
          className="min-h-[70vh] overflow-hidden bg-neutral-950 text-white md:min-h-[85vh]"
        >
          <Parallax className="absolute inset-0" amount={6}>
            <Media fill resource={tile.image} imgClassName="object-cover" />
          </Parallax>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

          <StaggerGroup className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-14 text-center">
            {tile.eyebrow && (
              <p className="text-xs uppercase tracking-[0.25em] text-white/80">{tile.eyebrow}</p>
            )}
            <h3 className="max-w-md text-3xl font-light leading-tight tracking-tight md:text-4xl">
              {tile.title}
            </h3>
            {/* after:absolute makes the whole tile clickable */}
            <CMSLink
              {...tile.link}
              appearance="inline"
              className="mt-2 border-b border-white pb-1 text-xs uppercase tracking-[0.2em] after:absolute after:inset-0 after:content-['']"
            />
          </StaggerGroup>
        </ClipReveal>
      ))}
    </section>
  )
}
