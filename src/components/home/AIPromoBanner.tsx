"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { motion } from "framer-motion"

import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import { fadeUp } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie } from "@/lib/tmdb/types"

type AIPromoBannerProps = {
	movies: TMDBMovie[]
}

export function AIPromoBanner({ movies }: AIPromoBannerProps) {
	const ref = useRef(null)
	useRevealOnScroll(ref)

	const collageMovies = movies.slice(0, 3).filter((m) => m.poster_path)
	const backdrop = movies.find((m) => m.backdrop_path)?.backdrop_path

	return (
		<section ref={ref} className="relative overflow-hidden px-6 py-24 md:px-12 md:py-36">
			{backdrop ? (
				<div className="pointer-events-none absolute inset-0">
					<Image
						src={tmdb.getImageUrl(backdrop, "w780")}
						alt=""
						fill
						unoptimized
						className="object-cover opacity-25"
						sizes="100vw"
					/>
					<div className="absolute inset-0 bg-[var(--color-ink)]/80" />
					<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)]/70 to-transparent" />
				</div>
			) : null}

			<motion.div
				className="relative z-10 mx-auto grid max-w-7xl items-end gap-12 md:grid-cols-[1.2fr_0.8fr]"
				variants={fadeUp}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]">
						Taste engine
					</p>
					<h2 className="mt-4 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-6xl">
						Ask Frameo
					</h2>
					<p className="mt-4 max-w-lg text-lg text-[var(--color-text-secondary)]">
						Mood in. Watchable picks out — matched to your taste, not a trending list.
					</p>
					<motion.div className="mt-8" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
						<Link
							href="/recommendations"
							className="inline-flex items-center gap-2 rounded-full bg-[var(--color-signal)] px-7 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
						>
							Get tonight&apos;s picks
							<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)]/15">
								<ArrowRight className="h-3.5 w-3.5" />
							</span>
						</Link>
					</motion.div>
				</div>

				<div className="flex justify-start gap-3 md:justify-end">
					{collageMovies.map((movie, index) => (
						<motion.div
							key={movie.id}
							className="relative h-40 w-[108px] overflow-hidden rounded-xl border border-[var(--color-border)] md:h-52 md:w-[140px]"
							style={{ marginTop: index * 12 }}
							whileHover={{ y: -6 }}
							transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
						>
							<Image
								src={tmdb.getImageUrl(movie.poster_path!, "w500")}
								alt={movie.title}
								fill
								unoptimized
								className="object-cover"
								sizes="140px"
							/>
						</motion.div>
					))}
				</div>
			</motion.div>
		</section>
	)
}
