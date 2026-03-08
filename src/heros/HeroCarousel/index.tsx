'use client'

import React, { useEffect, useState } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useHeaderTheme } from '@/providers/HeaderTheme'

type HeroSlide = NonNullable<Page['hero']['slides']>[number]

export const HeroCarousel: React.FC<Page['hero']> = (props) => {
  const { setHeaderTheme } = useHeaderTheme()
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  const slides: HeroSlide[] = props.slides || []

  useEffect(() => {
    if (!api || slides.length < 2) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, 6000)

    return () => clearInterval(interval)
  }, [api, slides.length])

  useEffect(() => {
    if (!api) return

    const onSelect = () => setCurrent(api.selectedScrollSnap())

    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  if (!slides.length) return null

  return (
    <section className="relative -mt-16 overflow-hidden text-white">
      <Carousel className="h-[75vh] w-full min-h-128" opts={{ loop: true }} setApi={setApi}>
        <CarouselContent className="h-[75vh] min-h-128 ml-0">
          {slides.map((slide, index) => (
            <CarouselItem className="h-[75vh] min-h-128 w-full pl-0" key={slide.id || index}>
              <div className="relative h-full w-full">
                {slide.image && typeof slide.image === 'object' && (
                  <Media
                    fill
                    imgClassName="object-cover object-center opacity-75 h-full w-full"
                    className="h-[75vh] min-h-128 w-full"
                    priority={index === 0}
                    resource={slide.image}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/20" />

                <div className="absolute inset-0 flex items-end md:items-center">
                  <div className="container pb-14 md:pb-0">
                    <div className="max-w-2xl">
                      {slide.caption && (
                        <p className="mb-3 text-base font-semibold uppercase tracking-[0.22em] text-white">
                          {slide.caption}
                        </p>
                      )}
                      {slide.text && (
                        <p className="mb-6 max-w-xl text-base leading-relaxed text-white md:text-3xl">
                          {slide.text}
                        </p>
                      )}
                      {Array.isArray(slide.links) && slide.links.length > 0 && (
                        <ul className="flex flex-wrap gap-3">
                          {slide.links.map((linkItem, i) => (
                            <li key={`${slide.id || index}-${i}`}>
                              <CMSLink
                                className="min-w-32 justify-center"
                                size="lg"
                                {...linkItem.link}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 md:block">
          <div className="container relative">
            <CarouselPrevious className="pointer-events-auto left-4 border-white/60 bg-black/35 text-white hover:bg-black/55" />
            <CarouselNext className="pointer-events-auto right-4 border-white/60 bg-black/35 text-white hover:bg-black/55" />
          </div>
        </div> */}
      </Carousel>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition ${
                current === index ? 'bg-white' : 'bg-white/45 hover:bg-white/70'
              }`}
              key={slide.id || index}
              onClick={() => api?.scrollTo(index)}
              type="button"
            />
          ))}
        </div>
      )}
    </section>
  )
}
