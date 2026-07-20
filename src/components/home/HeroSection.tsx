"use client"

import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { AnimatePresence, motion } from "framer-motion"

import { TrailerModal } from "@/components/movie/TrailerModal"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { fadeIn } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import { getTrpcClient } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"

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

	const brandRef = useRef<HTMLDivElement>(null)
	const headlineRef = useRef<HTMLHeadingElement>(null)
	const supportRef = useRef<HTMLParagraphElement>(null)
	const ctaRef = useRef<HTMLDivElement>(null)

	const currentMovie = movies[currentIndex] || movies[0]
	const currentTrailerKey = currentMovie ? (trailerByMovieId[currentMovie.id] ?? null) : null

	useEffect(() => {
		if (!isAutoPlay || movies.length <= 1) return
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % movies.length)
		}, 7000)
		return () => clearInterval(timer)
	}, [isAutoPlay, movies.length])

	useEffect(() => {
		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches

		const targets = [brandRef.current, headlineRef.current, supportRef.current, ctaRef.current].filter(
			Boolean,
		) as HTMLElement[]

		if (targets.length === 0) return

		if (reduced) {
			gsap.set(targets, { opacity: 1, y: 0, clipPath: "none" })
			return
		}

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
			tl.fromTo(
				brandRef.current,
				{ opacity: 0, y: 28, clipPath: "inset(0 0 100% 0)" },
				{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.85 },
			)
				.fromTo(
					headlineRef.current,
					{ opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
					{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.9 },
					"-=0.45",
				)
				.fromTo(
					supportRef.current,
					{ opacity: 0, y: 20 },
					{ opacity: 1, y: 0, duration: 0.65 },
					"-=0.4",
				)
				.fromTo(
					ctaRef.current,
					{ opacity: 0, y: 16 },
					{ opacity: 1, y: 0, duration: 0.55 },
					"-=0.35",
				)
		})

		return () => ctx.revert()
	}, [])

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
			if (result.source === "error") return
			const trailerKey = result.trailerKey ?? null
			setTrailerByMovieId((prev) => ({ ...prev, [currentMovie.id]: trailerKey }))
			shouldOpenModal = true
		} catch {
			return
		} finally {
			setTrailerLoading(false)
			if (shouldOpenModal) setTrailerOpen(true)
		}
	}

	return (
		<section className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--color-ink)]">
			<AnimatePresence mode="wait">
				{currentMovie?.backdrop_path ? (
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
							alt=""
							fill
							unoptimized
							className="object-cover scale-105"
							sizes="100vw"
							priority
						/>
					</motion.div>
				) : null}
			</AnimatePresence>

			<div className="absolute inset-0 bg-[var(--color-ink)]/35" />
			<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/55 to-[var(--color-ink)]/25" />
			<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)]/40 to-transparent" />

			<div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col justify-end px-6 pb-16 pt-28 md:px-12 md:pb-24">
				<div className="max-w-3xl">
					<div
						ref={brandRef}
						className="flex flex-wrap items-center gap-5 md:gap-7"
					>
						<Image
							src="/frameo.webp"
							alt=""
							width={320}
							height={240}
							priority
							className="h-[clamp(5.5rem,16vw,10rem)] w-auto object-contain object-left"
						/>
						<p className="font-heading text-[clamp(4.5rem,15vw,9.5rem)] font-extrabold leading-[0.88] tracking-[-0.03em] text-[var(--color-signal)]">
							Frameo
						</p>
					</div>
					<h1
						ref={headlineRef}
						className="mt-5 font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-text)]"
					>
						Tonight&apos;s pick, not tomorrow&apos;s list
					</h1>
					<p
						ref={supportRef}
						className="mt-4 max-w-md text-base text-[var(--color-text-secondary)] md:text-lg"
					>
						{currentMovie
							? `Now trending: ${currentMovie.title}`
							: "AI taste matching for the next frame you actually watch."}
					</p>

					<div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-3">
						<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
							<Link
								href="/recommendations"
								className="inline-flex items-center gap-2 rounded-full bg-[var(--color-signal)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
							>
								Ask Frameo
								<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)]/15">
									<ArrowRight className="h-3.5 w-3.5" />
								</span>
							</Link>
						</motion.div>
						<motion.button
							type="button"
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleWatchTrailer}
							disabled={trailerLoading || !currentMovie}
							className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] px-5 py-3 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)] disabled:opacity-60"
						>
							{trailerLoading ? (
								<LoadingSpinner size="sm" className="scale-75" />
							) : (
								<Play className="h-4 w-4" />
							)}
							Trailer
						</motion.button>
						<button
							type="button"
							onClick={() => currentMovie && router.push(`/movie/${currentMovie.id}`)}
							className="text-sm text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
						>
							Open film
						</button>
					</div>
				</div>

				{movies.length > 1 ? (
					<div className="mt-10 flex gap-2">
						{movies.map((movie, index) => (
							<button
								key={movie.id}
								type="button"
								aria-label={`Show ${movie.title}`}
								onClick={() => {
									setCurrentIndex(index)
									setIsAutoPlay(false)
								}}
								className={`h-1 rounded-full transition-all duration-500 ${
									index === currentIndex
										? "w-10 bg-[var(--color-signal)]"
										: "w-4 bg-[var(--color-text)]/25 hover:bg-[var(--color-text)]/45"
								}`}
							/>
						))}
					</div>
				) : null}
			</div>

			<TrailerModal
				isOpen={trailerOpen}
				onClose={() => setTrailerOpen(false)}
				trailerKey={currentTrailerKey}
				movieTitle={currentMovie?.title ?? "Trailer"}
			/>
		</section>
	)
}
