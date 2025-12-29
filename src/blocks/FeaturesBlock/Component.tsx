import type { FeaturesBlock as FeaturesBlockProps } from '@/payload-types'
import { Clock, Headphones, ShieldCheck, Truck } from 'lucide-react'
import React from 'react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Authentic Watches',
  },
  {
    icon: Truck,
    title: 'Nationwide Delivery',
  },
  {
    icon: Clock,
    title: 'Timeless Quality',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
  },
]

export const FeaturesBlock: React.FC<FeaturesBlockProps> = () => {
  return (
    <div className="container flex items-center justify-center py-16 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 text-center uppercase">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-foreground/90 hover:text-foreground transition-colors"
            >
              <div className="mb-4 h-12 w-12 flex items-center justify-center bg-muted rounded-full shadow-sm">
                <feature.icon className="size-6" />
              </div>
              <span className="text-sm font-medium tracking-wide">{feature.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
