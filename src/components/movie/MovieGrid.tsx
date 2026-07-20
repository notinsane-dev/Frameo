"use client"

import { motion } from "framer-motion"

import { MovieCard } from "@/components/movie/MovieCard"
import { listItem, staggerContainer } from "@/lib/animations"
import type { TMDBMovie } from "@/lib/tmdb/types"

type MovieGridProps = {
  movies: TMDBMovie[]
  loading?: boolean
  title?: string
}

export function MovieGrid({ movies, loading = false, title }: MovieGridProps) {
  return (
    <section className="space-y-4">
      {title ? (
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h2>
      ) : null}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        {loading
          ? Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[2/3] rounded-xl border border-[var(--color-border)] skeleton"
              />
            ))
          : movies.map((movie) => (
              <motion.div key={movie.id} variants={listItem}>
                <MovieCard movie={movie} />
              </motion.div>
            ))}
      </motion.div>
    </section>
  )
}
