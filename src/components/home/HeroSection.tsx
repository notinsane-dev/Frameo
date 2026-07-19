"use client"

import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { TrailerModal } from "@/components/movie/TrailerModal"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { RatingStars } from "@/components/shared/RatingStars"
import { tmdb } from "@/lib/tmdb/client"
import { getTrpcClient } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { AnimatePresence, motion } from "framer-motion"
import { fadeIn, fadeUp } from "@/lib/animations"

type HeroSectionProps = {
  movies: TMDBMovie[]
}

export function HeroSection({ movies }: HeroSectionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [trailerLoading, setTrailerLoading] = useState(false)
  const [trailerByMovieId, setTrailerByMovieId] = useState<Record<number, string | null>>({})

  const currentMovie = movies[currentIndex] || movies[0]
  const currentTrailerKey = currentMovie ? trailerByMovieId[currentMovie.id] ?? null : null

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (!isAutoPlay) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [isAutoPlay, movies.length])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length)
    setIsAutoPlay(false)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)
    setIsAutoPlay(false)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlay(false)
  }

  const handleWatchTrailer = async () => {
    if (!currentMovie || trailerLoading) return

    const cachedTrailer = trailerByMovieId[currentMovie.id]
    if (cachedTrailer !== undefined) {
      setTrailerOpen(true)
      return
    }

    setTrailerLoading(true)
    let shouldOpenModal = false

    try {
      const trpcClient = getTrpcClient()
      const result = await trpcClient.movies.getTrailer.query({ id: currentMovie.id })

      if (result.source === "error") {
        return
      }

      const trailerKey = result.trailerKey ?? null

      setTrailerByMovieId((prev) => ({
        ...prev,
        [currentMovie.id]: trailerKey,
      }))

      shouldOpenModal = true
    } catch {
      return
    } finally {
      setTrailerLoading(false)
      if (shouldOpenModal) {
        setTrailerOpen(true)
      }
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#080808]">
      {/* Background with movie backdrop */}
      <AnimatePresence mode="wait">
        {currentMovie?.backdrop_path && (
          <motion.div
            key={currentMovie.id}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0"
          >
            <Image
              src={tmdb.getImageUrl(currentMovie.backdrop_path, "w780")}
              alt={currentMovie.title}
              fill
              unoptimized
              className="object-cover"
              sizes="100vw"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-transparent to-transparent" />

      {/* Left decorative line */}
      <div className="absolute left-6 top-1/2 h-32 w-1 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#C9A84C] to-transparent" />

      {/* Content - Bottom Left */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 pb-12 md:px-12 lg:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMovie?.id}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="max-w-3xl flex-1"
          >
            {/* Label */}
            <div className="mb-4 text-xs font-bold tracking-widest text-[#C9A84C]">
              🎬 TRENDING NOW
            </div>

            {/* Title */}
            <h1 className="mb-3 font-playfair text-5xl font-bold text-white lg:text-6xl">
              {currentMovie?.title}
            </h1>

            {/* Metadata Row */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <RatingStars rating={currentMovie?.vote_average || 0} showNumber />

              {currentMovie?.release_date && (
                <div className="text-sm text-white/70">
                  {new Date(currentMovie.release_date).getFullYear()}
                </div>
              )}

              {currentMovie?.genres && currentMovie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentMovie.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full border border-[#C9A84C]/50 px-2 py-1 text-xs text-[#C9A84C]"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            {currentMovie?.overview && (
              <p className="mb-8 line-clamp-2 max-w-xl font-dm-sans text-base text-white/70">
                {currentMovie.overview}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => router.push(`/movie/${currentMovie?.id}`)}
                className="group flex items-center justify-center gap-2 rounded-lg bg-[#C9A84C] px-6 py-3 font-dm-sans font-semibold text-[#080808] transition-all duration-300 hover:bg-[#D4B961]"
              >
                Explore Movie
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleWatchTrailer}
                disabled={trailerLoading}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-dm-sans font-semibold text-white transition-all duration-300 hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 hover:text-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {trailerLoading ? <LoadingSpinner size="sm" className="scale-75" /> : <Play className="h-4 w-4" />}
                Watch Trailer
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots Counter - Right */}
        <div className="ml-8 flex flex-col gap-3">
          {movies.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-[#C9A84C]" : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4">
        <button
          onClick={handlePrev}
          className="rounded-lg border border-white/20 p-2 text-white/60 transition-all duration-300 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
        >
          <ArrowRight className="h-6 w-6 rotate-180" />
        </button>
        <button
          onClick={handleNext}
          className="rounded-lg border border-white/20 p-2 text-white/60 transition-all duration-300 hover:border-[#C9A84C] hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>

      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerKey={currentTrailerKey}
        movieTitle={currentMovie?.title ?? "Trailer"}
      />
    </div>
  )
}
