"use client"

import { motion } from "framer-motion"
import { Clapperboard, Star } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { TrailerModal } from "@/components/movie/TrailerModal"
import { RatingStars } from "@/components/shared/RatingStars"
import { WatchlistButton } from "@/components/movie/WatchlistButton"
import { RatingModal } from "@/components/movie/RatingModal"
import { staggerContainer, listItem } from "@/lib/animations"
import { useParallax } from "@/hooks/useGSAPAnimations"
import { useAuth } from "@/hooks/useAuth"
import { useRatings } from "@/hooks/useRatings"
import { useToastContext } from "@/components/shared/ToastProvider"
import { tmdb } from "@/lib/tmdb/client"
import { getTrailerKey } from "@/lib/tmdb/helpers"
import type { TMDBMovieDetail } from "@/lib/tmdb/types"

type MovieHeroProps = {
  movie: TMDBMovieDetail
}

export function MovieHero({ movie }: MovieHeroProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToastContext()
  const [imageError, setImageError] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const backdropRef = useRef<HTMLDivElement | null>(null)
  const { getUserRating } = useRatings()
  const userRating = getUserRating(movie.id)
  const isAuthenticatedAfterHydration = hasHydrated && isAuthenticated
  const trailerKey = getTrailerKey(movie.videos?.results ?? [])

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  useParallax(backdropRef, 0.45)

  const handleOpenRatingModal = () => {
    if (!isAuthenticatedAfterHydration) {
      showToast("Please sign in to rate movies", "info")
      router.push("/login")
      return
    }

    setIsRatingModalOpen(true)
  }

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden border-b border-white/10">
        <div ref={backdropRef} className="absolute inset-0">
          {movie.backdrop_path && !imageError ? (
            <Image
              src={tmdb.getImageUrl(movie.backdrop_path, "w780")}
              alt={movie.title}
              fill
              unoptimized
              priority
              sizes="100vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-[#080808]" />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-7xl items-end px-6 pb-12"
        >
          <div className="max-w-2xl space-y-4">
            {movie.genres?.length ? (
              <motion.div variants={listItem} className="flex flex-wrap gap-2">
                {movie.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80"
                  >
                    {genre.name}
                  </span>
                ))}
              </motion.div>
            ) : null}

            <motion.h1 variants={listItem} className="font-heading text-4xl text-white md:text-6xl">
              {movie.title}
            </motion.h1>

            {movie.tagline ? (
              <motion.p variants={listItem} className="text-lg italic text-white/60">
                {movie.tagline}
              </motion.p>
            ) : null}

            <motion.div variants={listItem} className="flex items-center gap-4">
              <RatingStars rating={movie.vote_average} size="md" showNumber />
              {movie.vote_count ? <span className="text-sm text-white/60">{movie.vote_count} votes</span> : null}
            </motion.div>

            <motion.p variants={listItem} className="line-clamp-3 text-white/70">
              {movie.overview || "No overview available."}
            </motion.p>

            <motion.div variants={listItem} className="flex flex-wrap items-center gap-3 pt-2">
              {trailerKey ? (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#080808] transition-colors duration-200 hover:bg-[#d8b964]"
                >
                  <Clapperboard className="h-4 w-4" />
                  Watch Trailer
                </button>
              ) : null}
              <WatchlistButton movie={movie} variant="full" />
              <motion.button
                onClick={handleOpenRatingModal}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userRating ? (
                  <>
                    <Star className="h-4 w-4 fill-[#C9A84C]" />
                    <span className="text-[#C9A84C]">Your Rating:</span>
                    <RatingStars rating={userRating.rating} size="sm" showNumber />
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    {isAuthenticatedAfterHydration ? "Rate Movie" : "Sign In to Rate"}
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <RatingModal
        movie={movie}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        existingRating={userRating}
      />
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerKey={trailerKey}
        movieTitle={movie.title}
      />
    </>
  )
}
