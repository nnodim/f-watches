'use client'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { GridTileImage } from '../Grid/tile'

export type GalleryImage = {
  image: MediaType
  variantID?: string
}

type Props = {
  gallery: GalleryImage[]
}

export const Gallery2: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [mainApi, setMainApi] = React.useState<CarouselApi>()
  const [thumbsApi, setThumbsApi] = React.useState<CarouselApi>()
  const [isVertical, setIsVertical] = useState(false)

  // Handle responsive orientation
  useEffect(() => {
    const checkScreenSize = () => {
      setIsVertical(window.innerWidth >= 1024) // lg breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbsApi) return
      mainApi.scrollTo(index)
    },
    [mainApi, thumbsApi],
  )

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbsApi) return
    setSelectedIndex(mainApi.selectedScrollSnap())
    thumbsApi.scrollTo(mainApi.selectedScrollSnap())
  }, [mainApi, thumbsApi])

  useEffect(() => {
    if (!mainApi) return
    onSelect()
    mainApi.on('select', onSelect).on('reInit', onSelect)
  }, [mainApi, onSelect])

  useEffect(() => {
    const variantID = searchParams.get('variant')

    if (variantID && mainApi) {
      const index = gallery.findIndex((item) => item.variantID === variantID)
      if (index !== -1) {
        setSelectedIndex(index)
        mainApi.scrollTo(index, true)
      }
    }
  }, [searchParams, mainApi, gallery])

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-5">
      {/* Main Carousel */}
      <Carousel setApi={setMainApi} className="w-full" opts={{ loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => (
            <CarouselItem key={`main-${item.image.id}-${i}`}>
              <div className="relative w-full overflow-hidden">
                <Media resource={item.image} className="w-full" imgClassName="w-full rounded-lg" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>

      {/* Thumbnails Carousel */}
      <Carousel
        key={isVertical ? 'vertical' : 'horizontal'}
        setApi={setThumbsApi}
        className="w-full lg:w-fit"
        orientation={isVertical ? 'vertical' : 'horizontal'}
        opts={{
          align: 'start',
          containScroll: 'keepSnaps',
          dragFree: true,
        }}
      >
        <CarouselContent className="lg:max-w-24">
          {gallery.map((item, i) => (
            <CarouselItem
              className="basis-1/3 lg:basis-1/5 cursor-pointer"
              key={`thumb-${item.image.id}-${i}`}
              onClick={() => onThumbClick(i)}
            >
              <GridTileImage active={i === selectedIndex} media={item.image} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
