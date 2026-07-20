"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

import { MovieCard } from "@/components/movie/MovieCard"
import { listItem, staggerContainer } from "@/lib/animations"
import type { TMDBMovie } from "@/lib/tmdb/types"

type RankedMovieListProps = {
	movies: TMDBMovie[]
	meta?: (movie: TMDBMovie, index: number) => ReactNode
}

export function RankedMovieList({ movies, meta }: RankedMovieListProps) {
	if (movies.length === 0) {
		return (
			<div className="rounded-2xl border border-[var(--color-border)] px-6 py-12 text-center">
				<p className="text-sm text-[var(--color-text-secondary)]">
					No titles ranked for this period yet.
				</p>
			</div>
		)
	}

	return (
		<motion.div
			className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
			variants={staggerContainer}
			initial="hidden"
			animate="visible"
		>
			{movies.map((movie, index) => (
				<motion.div key={movie.id} variants={listItem} className="relative">
					<span className="pointer-events-none absolute -bottom-1 left-0 z-0 font-heading text-6xl font-extrabold leading-none text-[var(--color-text)]/[0.06] select-none md:text-7xl">
						{String(index + 1).padStart(2, "0")}
					</span>
					<div className="relative z-10">
						<MovieCard movie={movie} />
						{meta ? (
							<div className="mt-2 text-xs text-[var(--color-text-muted)]">
								{meta(movie, index)}
							</div>
						) : null}
					</div>
				</motion.div>
			))}
		</motion.div>
	)
}
