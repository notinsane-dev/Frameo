"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { motion } from "framer-motion"

import { MovieCard } from "@/components/movie/MovieCard"
import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import { listItem, staggerContainer } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie } from "@/lib/tmdb/types"

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
		<section ref={ref} className="px-6 py-24 md:px-12 md:py-32">
			<div className="mb-12 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
						{title}
					</h2>
					{subtitle ? (
						<p className="mt-2 max-w-md text-[var(--color-text-secondary)]">{subtitle}</p>
					) : null}
				</div>
				<Link
					href="/explore"
					className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-signal)] transition-opacity hover:opacity-80"
				>
					View all
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>

			<motion.div
				className="grid gap-8"
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.15 }}
			>
				{firstMovie ? (
					<motion.div
						variants={listItem}
						className="relative grid overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
					>
						<div className="relative min-h-[240px] md:min-h-[320px]">
							{firstMovie.backdrop_path ? (
								<Image
									src={tmdb.getImageUrl(firstMovie.backdrop_path, "w780")}
									alt={firstMovie.title}
									fill
									unoptimized
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 55vw"
								/>
							) : (
								<div className="absolute inset-0 bg-[var(--color-ink-elevated)]" />
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[var(--color-surface)]" />
						</div>

						<div className="relative z-10 flex flex-col justify-center gap-4 p-6 md:p-10">
							{firstMovie.poster_path ? (
								<div className="relative mb-2 hidden h-28 w-[76px] overflow-hidden rounded-lg md:block">
									<Image
										src={tmdb.getImageUrl(firstMovie.poster_path, "w200")}
										alt=""
										fill
										unoptimized
										className="object-cover"
										sizes="76px"
									/>
								</div>
							) : null}
							<h3 className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
								{firstMovie.title}
							</h3>
							<p className="line-clamp-3 max-w-lg text-[var(--color-text-secondary)]">
								{firstMovie.overview}
							</p>
							<Link
								href={`/movie/${firstMovie.id}`}
								className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-signal)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
							>
								Explore
								<ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</motion.div>
				) : null}

				<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 md:gap-5">
					{restMovies.map((movie) => (
						<motion.div key={movie.id} variants={listItem}>
							<MovieCard movie={movie} />
						</motion.div>
					))}
				</div>
			</motion.div>
		</section>
	)
}
