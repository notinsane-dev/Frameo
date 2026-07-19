"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRef } from "react"

import { MovieCard } from "@/components/movie/MovieCard"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { tmdb } from "@/lib/tmdb/client"
import { listItem, staggerContainer } from "@/lib/animations"
import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"

type FeaturedSectionProps = {
  movies: TMDBMovie[]
  title: string
  subtitle?: string
}

export function FeaturedSection({ movies, title, subtitle }: FeaturedSectionProps) {
  const ref = useRef(null)
  useRevealOnScroll(ref)

  const firstMovie = movies[0]
  const restMovies = movies.slice(1, 13)

  return (
    <section ref={ref} className="px-6 py-20 md:px-12">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="font-playfair text-4xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-white/60">{subtitle}</p>}
        </div>
        <Link
          href="/explore"
          className="flex items-center gap-2 rounded-lg border border-[#C9A84C] px-4 py-2 text-[#C9A84C] transition-all duration-300 hover:bg-[#C9A84C]/10"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <motion.div
        className="grid gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Featured Movie (First) */}
        {firstMovie && (
          <motion.div
            variants={listItem}
            className="group relative overflow-hidden rounded-lg"
            style={{ gridColumn: "span 1" }}
          >
            {/* Background Image (Blurred) */}
            {firstMovie.backdrop_path && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={tmdb.getImageUrl(firstMovie.backdrop_path, "w780")}
                  alt={firstMovie.title}
                  fill
                  unoptimized
                  className="object-cover blur-xl scale-110"
                  sizes="100vw"
                />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 z-1 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex gap-6 p-8">
              {/* Poster */}
              {firstMovie.poster_path && (
                <div className="flex-shrink-0">
                  <Image
                    src={tmdb.getImageUrl(firstMovie.poster_path, "w500")}
                    alt={firstMovie.title}
                    width={120}
                    height={180}
                    unoptimized
                    className="rounded-lg"
                    sizes="120px"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex flex-col justify-end pb-2">
                <h3 className="mb-2 font-playfair text-2xl font-bold text-white">
                  {firstMovie.title}
                </h3>
                <p className="mb-4 line-clamp-3 max-w-md text-white/70">{firstMovie.overview}</p>

                <Link
                  href={`/movie/${firstMovie.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-6 py-2 font-dm-sans font-semibold text-[#080808] transition-all duration-300 hover:bg-[#D4B961] w-fit"
                >
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Movie Grid */}
        <motion.div
          className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {restMovies.map((movie) => (
              <motion.div key={movie.id} variants={listItem}>
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  )
}
