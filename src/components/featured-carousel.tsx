'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Carousel, CarouselContent, type CarouselApi } from '@/components/ui/carousel'

type Props = {
  children: React.ReactNode
}

export const FeaturedProductsCarousel: React.FC<Props> = ({ children }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!api) return

    const update = () => {
      setCurrent(api.selectedScrollSnap() + 1)
      setTotal(api.scrollSnapList().length)
    }

    update()

    api.on('select', update)
    api.on('reInit', update)

    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api])

  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          slidesToScroll: 1,
          containScroll: 'keepSnaps',
          loop: true
        }}
        className="w-full"
      >
        <CarouselContent className="ml-0">{children}</CarouselContent>
      </Carousel>

      {/* Custom carousel controls */}
      <div className="mt-16 flex w-full items-center justify-end px-5 md:px-20">
        {/* Slide counter and progress */}
        {/* <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums">{String(current).padStart(2, '0')}</span>

          <div className="relative h-1 w-24 overflow-hidden bg-neutral-300 sm:w-40">
            <div
              className="absolute left-0 top-0 h-full bg-foreground transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="text-lg font-bold tabular-nums">{String(total).padStart(2, '0')}</span>
        </div> */}

        {/* Previous / Next */}
        <div className="flex border border-foreground">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={!api?.canScrollPrev()}
            onClick={() => api?.scrollPrev()}
            className="flex h-16 w-16 items-center justify-center border-r border-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 md:h-20 md:w-20"
          >
            <ArrowLeft className="size-6 stroke-[1.5]" />
          </button>

          <button
            type="button"
            aria-label="Next slide"
            disabled={!api?.canScrollNext()}
            onClick={() => api?.scrollNext()}
            className="flex h-16 w-16 items-center justify-center transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 md:h-20 md:w-20"
          >
            <ArrowRight className="size-6 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  )
}
