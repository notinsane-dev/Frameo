"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { TrailerModal } from "@/components/movie/TrailerModal"
import { WatchlistButton } from "@/components/movie/WatchlistButton"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { hoverScale, tapScale } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import { getTrpcClient } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"

type MovieCardProps = {
  movie: TMDBMovie
  priority?: boolean
  showRating?: boolean
}

export function MovieCard({ movie, priority = false, showRating = true }: MovieCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [trailerStatus, setTrailerStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle")
  const [trailerKey, setTrailerKey] = useState<string | null>(null)

  const releaseYear = useMemo(() => {
    if (!movie.release_date) return "TBA"
    return movie.release_date.split("-")[0] || "TBA"
  }, [movie.release_date])

  const hasPoster = Boolean(movie.poster_path) && !imageError

  const handleNavigate = () => {
    router.push(`/movie/${movie.id}`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleNavigate()
    }
  }

  const fetchTrailerKey = async (): Promise<string | null> => {
    if (trailerStatus === "checking") return trailerKey
    if (trailerStatus === "available") return trailerKey
    if (trailerStatus === "unavailable") return null

    setTrailerStatus("checking")

    try {
      const trpcClient = getTrpcClient()
      const result = await trpcClient.movies.getTrailer.query({ id: movie.id })
      const key = result.trailerKey ?? null

      if (result.source === "error") {
        setTrailerStatus("idle")
        return null
      }

      setTrailerKey(key)
      setTrailerStatus(key ? "available" : "unavailable")
      return key
    } catch {
      setTrailerStatus("idle")
      return null
    }
  }

  const handlePreloadTrailer = () => {
    if (trailerStatus !== "idle") return
    void fetchTrailerKey()
  }

  const handleOpenTrailer = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (trailerStatus === "checking") return

    const key = trailerStatus === "available" ? trailerKey : await fetchTrailerKey()

    if (key) {
      setTrailerOpen(true)
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={hoverScale}
      whileTap={tapScale}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePreloadTrailer}
      onFocus={handlePreloadTrailer}
      className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-left"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {hasPoster ? (
          <Image
            src={tmdb.getImageUrl(movie.poster_path as string, "w500")}
            alt={movie.title}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-zinc-700/40 to-zinc-900/80" />
        )}

        {showRating ? (
          <div className="absolute right-3 top-3 rounded-full bg-[#C9A84C] px-2.5 py-1 text-xs font-semibold text-[#080808]">
            {movie.vote_average.toFixed(1)}
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <motion.div
          className="absolute left-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <WatchlistButton movie={movie} variant="icon" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {trailerStatus === "available" ? (
            <button
              type="button"
              onClick={handleOpenTrailer}
              className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Play className="h-3 w-3" />
              Trailer
            </button>
          ) : trailerStatus === "checking" ? (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
              <LoadingSpinner size="sm" className="scale-50" />
              Checking trailer
            </span>
          ) : null}
          <p className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</p>
          <p className="text-xs text-white/60">{releaseYear}</p>
          <span className="mt-3 inline-flex rounded-full border border-[#C9A84C]/40 px-3 py-1 text-xs text-[#C9A84C]">
            View Details
          </span>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-white">{movie.title}</p>
        <p className="text-xs text-white/50">{releaseYear}</p>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerKey={trailerKey}
        movieTitle={movie.title}
      />
    </motion.div>
  )
}
