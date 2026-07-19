"use client"

import { TrendingUp } from "lucide-react"
import { useRef } from "react"

import { MovieCard } from "@/components/movie/MovieCard"
import { listItem, staggerContainer } from "@/lib/animations"
import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { AnimatePresence, motion } from "framer-motion"

type TrendingSectionProps = {
  movies: TMDBMovie[]
}

export function TrendingSection({ movies }: TrendingSectionProps) {
  const ref = useRef(null)
  useRevealOnScroll(ref)
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <section ref={ref} className="px-6 py-20 md:px-12">
      {/* Header */}
      <div className="mb-12 flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-[#C9A84C]" />
        <h2 className="font-playfair text-4xl font-bold text-white">Trending This Week</h2>
      </div>

      {/* Scrollable Container */}
      <div className="overflow-x-auto">
        <motion.div
          ref={trackRef}
          className="flex gap-6 pb-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {movies.map((movie, index) => (
              <motion.div
                key={movie.id}
                variants={listItem}
                className="relative flex-shrink-0"
                style={{ width: "200px" }}
              >
                {/* Ranking Number */}
                <div className="absolute bottom-0 left-0 z-0 font-playfair text-8xl font-bold text-white/10 select-none">
                  {String(index + 1).padStart(2, "0")}
                </div>

                {/* Card */}
                <div className="relative z-10">
                  <MovieCard movie={movie} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
