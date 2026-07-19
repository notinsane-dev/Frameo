"use client"

import { useRef } from "react"

import { useCountUp } from "@/hooks/useGSAPAnimations"

type ProfileUser = {
  name?: string | null
  username?: string | null
  image?: string | null
  email?: string | null
} | null

type ProfileHeaderProps = {
  user: ProfileUser
  watchlistCount: number
  ratingsCount: number
  averageRating: number
}

function StatValue({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useCountUp(ref, value)

  return <span ref={ref} className="font-playfair text-3xl text-white" />
}

export function ProfileHeader({ user, watchlistCount, ratingsCount, averageRating }: ProfileHeaderProps) {
  return (
    <div className="glass-card flex flex-col gap-6 rounded-3xl p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Your Profile</p>
        <h1 className="mt-2 font-playfair text-4xl text-white">{user?.name || "Movie Lover"}</h1>
        <p className="mt-1 text-sm text-white/50">{user?.username ? `@${user.username}` : "No username set yet"}</p>
        <p className="mt-2 text-white/50">Track what you want to watch, rate what you have seen, and see your taste evolve.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <StatValue value={watchlistCount} />
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Watchlist</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <StatValue value={ratingsCount} />
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Ratings</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <StatValue value={averageRating} />
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">Avg Score</p>
        </div>
      </div>
    </div>
  )
}
