"use client"

import { useRef } from "react"
import { motion } from "framer-motion"

import { MovieCard } from "@/components/movie/MovieCard"
import { useHorizontalRailScrub, useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import { listItem, staggerContainer } from "@/lib/animations"
import type { TMDBMovie } from "@/lib/tmdb/types"

type TrendingSectionProps = {
	movies: TMDBMovie[]
}

export function TrendingSection({ movies }: TrendingSectionProps) {
	const sectionRef = useRef<HTMLElement>(null)
	const trackRef = useRef<HTMLDivElement>(null)
	useRevealOnScroll(sectionRef)
	useHorizontalRailScrub(sectionRef, trackRef)

	return (
		<section ref={sectionRef} className="overflow-hidden py-24 md:py-32">
			<div className="mb-10 px-6 md:px-12">
				<p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]">
					This week
				</p>
				<h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
					Trending frames
				</h2>
			</div>

			<div className="px-6 md:px-12">
				<motion.div
					ref={trackRef}
					className="flex w-max gap-5 will-change-transform md:gap-7"
					variants={staggerContainer}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.2 }}
				>
					{movies.map((movie, index) => (
						<motion.div
							key={movie.id}
							variants={listItem}
							className="relative w-[160px] flex-none sm:w-[180px] md:w-[200px]"
						>
							<span className="pointer-events-none absolute -bottom-2 left-0 z-0 font-heading text-7xl font-extrabold leading-none text-[var(--color-text)]/[0.06] select-none md:text-8xl">
								{String(index + 1).padStart(2, "0")}
							</span>
							<div className="relative z-10">
								<MovieCard movie={movie} />
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
