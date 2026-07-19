"use client"

import Link from "next/link"

import { WatchlistTab } from "@/app/(main)/profile/components/WatchlistTab"

export default function WatchlistPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[#C9A84C]">Watchlist</p>
        <h1 className="mt-2 font-playfair text-4xl text-white">Everything you want to watch</h1>
        <p className="mt-3 text-white/50">A focused view of your saved movies, ready for the next movie night.</p>
      </div>
      <WatchlistTab />
      <Link href="/profile?tab=stats" className="text-sm text-[#C9A84C]">
        See your stats
      </Link>
    </div>
  )
}
