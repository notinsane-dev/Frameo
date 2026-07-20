"use client"

import { motion } from "framer-motion"
import { BookCheck, Play, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { RatingModal } from "@/components/movie/RatingModal"
import { TrailerModal } from "@/components/movie/TrailerModal"
import { WatchlistButton } from "@/components/movie/WatchlistButton"
import { RatingStars } from "@/components/shared/RatingStars"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useAuth } from "@/hooks/useAuth"
import { useParallax } from "@/hooks/useGSAPAnimations"
import { useRatings } from "@/hooks/useRatings"
import { listItem, staggerContainer } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import { getTrailerKey } from "@/lib/tmdb/helpers"
import { trpc } from "@/lib/trpc/client"
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
	const [quoteRatingId, setQuoteRatingId] = useState<number | null>(null)
	const [trailerOpen, setTrailerOpen] = useState(false)
	const [hasHydrated, setHasHydrated] = useState(false)
	const backdropRef = useRef<HTMLDivElement | null>(null)
	const { getUserRating } = useRatings()
	const userRating = getUserRating(movie.id)
	const isAuthenticatedAfterHydration = hasHydrated && isAuthenticated
	const trailerKey = getTrailerKey(movie.videos?.results ?? [])
	const utils = trpc.useUtils()
	const year = movie.release_date ? movie.release_date.slice(0, 4) : null

	const logWatched = trpc.diary.logWatched.useMutation({
		onSuccess: async (row) => {
			showToast(
				row.capsuleReview ? `Logged — ${row.capsuleReview}` : "Logged to Smart Log",
				"success",
			)
			await utils.diary.list.invalidate()
		},
		onError: (error) => showToast(error.message || "Failed to log watch", "error"),
	})

	useEffect(() => {
		setHasHydrated(true)
	}, [])

	useEffect(() => {
		if (typeof window === "undefined") return
		const params = new URLSearchParams(window.location.search)
		const quoteParam = params.get("quoteRatingId")
		const rateParam = params.get("rate")
		const parsed = quoteParam ? Number(quoteParam) : NaN
		if (rateParam === "1" || Number.isFinite(parsed)) {
			if (Number.isFinite(parsed) && parsed > 0) {
				setQuoteRatingId(parsed)
			}
			if (isAuthenticatedAfterHydration) {
				setIsRatingModalOpen(true)
			}
		}
	}, [isAuthenticatedAfterHydration])

	useParallax(backdropRef, 0.35)

	const handleOpenRatingModal = () => {
		if (!isAuthenticatedAfterHydration) {
			showToast("Please sign in to rate movies", "info")
			router.push("/login")
			return
		}
		setQuoteRatingId(null)
		setIsRatingModalOpen(true)
	}

	const handleCloseRatingModal = () => {
		setIsRatingModalOpen(false)
		setQuoteRatingId(null)
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search)
			if (params.has("quoteRatingId") || params.has("rate")) {
				router.replace(`/movie/${movie.id}`, { scroll: false })
			}
		}
	}

	const handleLogWatched = () => {
		if (!isAuthenticatedAfterHydration) {
			showToast("Please sign in to log watches", "info")
			router.push("/login")
			return
		}

		logWatched.mutate({
			movieId: movie.id,
			title: movie.title,
			poster: movie.poster_path ?? undefined,
			overview: movie.overview ?? undefined,
			generateCapsule: true,
		})
	}

	return (
		<>
			<section className="relative min-h-[100dvh] overflow-hidden border-b border-[var(--color-border)]">
				<div ref={backdropRef} className="absolute inset-0">
					{movie.backdrop_path && !imageError ? (
						<Image
							src={tmdb.getImageUrl(movie.backdrop_path, "w780")}
							alt=""
							fill
							unoptimized
							priority
							sizes="100vw"
							className="object-cover scale-105"
							onError={() => setImageError(true)}
						/>
					) : (
						<div className="absolute inset-0 bg-gradient-to-b from-[var(--color-ink-elevated)] to-[var(--color-ink)]" />
					)}
				</div>

				<div className="absolute inset-0 bg-[var(--color-ink)]/40" />
				<div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)] via-[var(--color-ink)]/70 to-[var(--color-ink)]/20" />
				<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/50 to-transparent" />

				<motion.div
					variants={staggerContainer}
					initial="hidden"
					animate="visible"
					className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl items-end gap-8 px-6 pb-14 pt-28 md:px-12 md:pb-20"
				>
					{movie.poster_path ? (
						<motion.div
							variants={listItem}
							className="relative hidden w-[200px] shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[0_24px_64px_rgba(0,0,0,0.5)] md:block lg:w-[240px]"
						>
							<div className="relative aspect-[2/3] w-full">
								<Image
									src={tmdb.getImageUrl(movie.poster_path, "w500")}
									alt={movie.title}
									fill
									unoptimized
									priority
									sizes="240px"
									className="object-cover"
								/>
							</div>
						</motion.div>
					) : null}

					<div className="max-w-2xl flex-1 space-y-5">
						{movie.genres?.length ? (
							<motion.div variants={listItem} className="flex flex-wrap items-center gap-x-3 gap-y-1">
								{movie.genres.slice(0, 4).map((genre, index) => (
									<span key={genre.id} className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--color-signal)]">
										{index > 0 ? (
											<span className="text-[var(--color-text-muted)]" aria-hidden>
												·
											</span>
										) : null}
										<Link
											href={`/explore?genre=${genre.id}`}
											className="transition-opacity hover:opacity-80"
										>
											{genre.name}
										</Link>
									</span>
								))}
							</motion.div>
						) : null}

						<motion.h1
							variants={listItem}
							className="font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-6xl lg:text-7xl"
						>
							{movie.title}
						</motion.h1>

						{movie.tagline ? (
							<motion.p
								variants={listItem}
								className="max-w-xl text-lg text-[var(--color-text-secondary)]"
							>
								{movie.tagline}
							</motion.p>
						) : null}

						<motion.div
							variants={listItem}
							className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]"
						>
							<RatingStars rating={movie.vote_average} size="md" showNumber />
							{year ? <span>{year}</span> : null}
							{movie.runtime ? <span>{movie.runtime} min</span> : null}
							{movie.vote_count ? (
								<span className="font-mono text-xs">
									{movie.vote_count.toLocaleString()} votes
								</span>
							) : null}
						</motion.div>

						<motion.p
							variants={listItem}
							className="line-clamp-4 max-w-xl text-base leading-relaxed text-[var(--color-text-secondary)]"
						>
							{movie.overview || "No overview available."}
						</motion.p>

						<motion.div variants={listItem} className="flex flex-wrap items-center gap-3 pt-1">
							{trailerKey ? (
								<motion.button
									type="button"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setTrailerOpen(true)}
									className="inline-flex items-center gap-2 rounded-full bg-[var(--color-signal)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
								>
									<Play className="h-4 w-4 fill-current" />
									Trailer
								</motion.button>
							) : null}

							<WatchlistButton movie={movie} variant="full" />

							<button
								type="button"
								onClick={handleLogWatched}
								disabled={logWatched.isPending}
								className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-cyan-rim)]/40 hover:text-[var(--color-cyan-rim)] disabled:opacity-60"
							>
								<BookCheck className="h-4 w-4" />
								{logWatched.isPending ? "Logging…" : "Log watched"}
							</button>

							<motion.button
								onClick={handleOpenRatingModal}
								type="button"
								className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]"
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								{userRating ? (
									<>
										<Star className="h-4 w-4 fill-[var(--color-signal)] text-[var(--color-signal)]" />
										<span className="text-[var(--color-signal)]">
											{userRating.rating.toFixed(1)}
										</span>
									</>
								) : (
									<>
										<Star className="h-4 w-4" />
										{isAuthenticatedAfterHydration ? "Rate" : "Sign in to rate"}
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
				onClose={handleCloseRatingModal}
				existingRating={userRating}
				quotedRatingId={quoteRatingId}
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
