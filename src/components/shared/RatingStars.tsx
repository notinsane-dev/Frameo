"use client"

import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

type RatingStarsProps = {
  rating: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
}

const starSizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-6 w-6",
} as const

export function RatingStars({ rating, size = "md", showNumber = false }: RatingStarsProps) {
  const normalized = Math.max(0, Math.min(5, rating / 2))
  const fullStars = Math.floor(normalized)
  const hasHalfStar = normalized - fullStars >= 0.5

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const isFull = index < fullStars
          const isHalf = index === fullStars && hasHalfStar

          if (isFull) {
            return (
              <Star
                key={index}
                className={cn(starSizeMap[size], "fill-[#C9A84C] text-[#C9A84C]")}
              />
            )
          }

          if (isHalf) {
            return (
              <span key={index} className="relative inline-flex">
                <Star className={cn(starSizeMap[size], "text-white/20")} />
                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  <Star className={cn(starSizeMap[size], "fill-[#C9A84C] text-[#C9A84C]")} />
                </span>
              </span>
            )
          }

          return <Star key={index} className={cn(starSizeMap[size], "text-white/20")} />
        })}
      </div>

      {showNumber ? <span className="text-sm text-white/70">{rating.toFixed(1)}/10</span> : null}
    </div>
  )
}
