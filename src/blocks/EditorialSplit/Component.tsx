import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { ClipReveal } from '@/components/motion/ClipReveal'
import { Magnetic } from '@/components/motion/Magnetic'
import { MaskText } from '@/components/motion/MaskText'
import { Parallax } from '@/components/motion/Parallax'
import { Reveal } from '@/components/motion/Reveal'
import type { EditorialSplitBlock as Props } from '@/payload-types'
import { cn } from '@/utilities/cn'
import React from 'react'

export const EditorialSplitBlock: React.FC<Props> = ({
  image,
  imagePosition,
  eyebrow,
  heading,
  body,
  enableLink,
  link,
}) => {
  const imageRight = imagePosition === 'right'

  return (
    <section className="">
      <div className="grid md:grid-cols-2">
        <ClipReveal
          mode={imageRight ? 'right' : 'left'}
          className={cn('min-h-[60vh] md:min-h-[80vh]', imageRight && 'md:order-2')}
        >
          <Parallax className="absolute inset-0">
            <Media fill resource={image} imgClassName="object-cover" />
          </Parallax>
        </ClipReveal>

        <div className="flex flex-col justify-center gap-6 px-8 py-20 md:px-16 lg:px-24">
          {eyebrow && (
            <Reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>
            </Reveal>
          )}
          <MaskText as="h2" className="text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
            {heading}
          </MaskText>
          {body && (
            <Reveal>
              <p className="max-w-md leading-relaxed text-muted-foreground">{body}</p>
            </Reveal>
          )}
          {enableLink && link && (
            <Reveal>
              <Magnetic>
                <CMSLink
                  {...link}
                  appearance="default"
                  size="lg"
                  className="rounded-none px-10 uppercase tracking-[0.18em]"
                />
              </Magnetic>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
