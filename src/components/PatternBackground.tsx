import Image from 'next/image'
import React from 'react'

type PatternImage = {
  src: string
  width?: number
  height?: number
  opacity?: number
  rotate?: number
}

interface PatternBackgroundProps {
  images: PatternImage[]
  opacity?: number // global opacity
  density?: number // how many images to randomly generate
  className?: string
}

export function PatternBackground({
  images,
  opacity = 0.7,
  density = 25,
  className = '',
}: PatternBackgroundProps) {
  // Random scatter generator
  const randomItems = Array.from({ length: density }).map(() => {
    const img = images[Math.floor(Math.random() * images.length)]

    return {
      ...img,
      top: Math.random() * 100, // %
      left: Math.random() * 100, // %
      rotate: img.rotate ?? Math.random() * 360,
      width: img.width ?? 80,
      height: img.height ?? 80,
      opacity: img.opacity ?? opacity,
    }
  })

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {randomItems.map((item, i) => (
        <Image
          key={i}
          src={item.src}
          width={item.width}
          height={item.height}
          style={{
            position: 'absolute',
            top: `${item.top}%`,
            left: `${item.left}%`,
            width: item.width,
            height: item.height,
            opacity: item.opacity,
            transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
          }}
          alt=""
        />
      ))}
    </div>
  )
}
