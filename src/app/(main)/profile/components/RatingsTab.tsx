"use client"

import { useRatings } from "@/hooks/useRatings"

export function RatingsTab() {
  const { ratings, isLoading } = useRatings()

  if (isLoading) {
    return <div className="h-48 rounded-2xl skeleton" />
  }

  if (!ratings.length) {
    return <p className="text-white/50">You have not rated any movies yet.</p>
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating) => (
        <div key={rating.movieId} className="glass-card flex items-center justify-between rounded-2xl p-4">
          <div>
            <p className="font-semibold text-white">{rating.title}</p>
            <p className="text-sm text-white/40">{rating.review || "No review added."}</p>
          </div>
          <div className="font-playfair text-3xl text-[#C9A84C]">{rating.rating}/10</div>
        </div>
      ))}
    </div>
  )
}
