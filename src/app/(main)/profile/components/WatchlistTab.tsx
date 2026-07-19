"use client"

import Image from "next/image"
import Link from "next/link"

import { WatchlistButton } from "@/components/movie/WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"
import { tmdb } from "@/lib/tmdb/client"

export function WatchlistTab() {
  const { watchlist, isLoading } = useWatchlist()

  if (isLoading) {
    return <div className="h-48 rounded-2xl skeleton" />
  }

  if (!watchlist.length) {
    return <p className="text-white/50">Your watchlist is empty.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {watchlist.map((item) => (
        <article key={item.movieId} className="glass-card flex gap-4 rounded-2xl p-4">
          <div className="relative h-28 w-20 overflow-hidden rounded-lg">
            <Image src={tmdb.getImageUrl(item.poster, "w200")} alt={item.title} fill unoptimized sizes="80px" className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-white/40">Added {new Date(item.addedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Link href={`/movie/${item.movieId}`} className="text-sm text-[#C9A84C]">
                View
              </Link>
              <WatchlistButton movie={{ id: item.movieId, title: item.title, overview: "", poster_path: item.poster, backdrop_path: null, release_date: "", vote_average: 0, genre_ids: [] }} variant="icon" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
