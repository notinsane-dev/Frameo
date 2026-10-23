"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Loader2, Star, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { useRatings } from "@/hooks/useRatings"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import type { UserRating } from "@/types"

gsap.registerPlugin(useGSAP)

type RatingModalProps = {
	movie: TMDBMovie
	isOpen: boolean
	onClose: () => void
	existingRating?: UserRating
	quotedRatingId?: number | null
}

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function RatingModal({
	movie,
	isOpen,
	onClose,
	existingRating,
	quotedRatingId,
}: RatingModalProps) {
	const { rateMovie, resetRating, isRating, isResetting } = useRatings()
	const rootRef = useRef<HTMLDivElement | null>(null)
	const backdropRef = useRef<HTMLDivElement | null>(null)
	const panelRef = useRef<HTMLDivElement | null>(null)
	const scoreRef = useRef<HTMLSpanElement | null>(null)
	const starsRef = useRef<HTMLDivElement | null>(null)
	const [mounted, setMounted] = useState(isOpen)
	const [rating, setRating] = useState(existingRating?.rating || 0)
	const [review, setReview] = useState(existingRating?.review || "")
	const [hoverRating, setHoverRating] = useState(0)

	const { data: quoteSource } = trpc.reviews.getQuoteSource.useQuery(
		{ ratingId: quotedRatingId! },
		{ enabled: Boolean(isOpen && quotedRatingId) },
	)

	const displayRating = hoverRating || rating
	const year = movie.release_date ? movie.release_date.slice(0, 4) : null

	const getHalfStepValue = (
		event: React.MouseEvent<HTMLButtonElement>,
		starIndex: number,
	): number => {
		const rect = event.currentTarget.getBoundingClientRect()
		const clickX = event.clientX - rect.left
		const isLeftHalf = clickX < rect.width / 2
		return isLeftHalf ? starIndex - 0.5 : starIndex
	}

	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => setMounted(true), 0)
			return () => clearTimeout(timer)
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return
		const timer = setTimeout(() => {
			setRating(existingRating?.rating ?? 0)
			setReview(existingRating?.review ?? "")
			setHoverRating(0)
		}, 0)
		return () => clearTimeout(timer)
	}, [existingRating, isOpen])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose()
		}
		if (mounted && isOpen) {
			window.addEventListener("keydown", handleKeyDown)
		}
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [mounted, isOpen, onClose])

	useGSAP(
		() => {
			if (!mounted || !backdropRef.current || !panelRef.current) return

			const reduce = prefersReducedMotion()
			const backdrop = backdropRef.current
			const panel = panelRef.current
			const bits = panel.querySelectorAll<HTMLElement>("[data-rate-bit]")

			if (isOpen) {
				gsap.set(backdrop, { opacity: 0 })
				gsap.set(panel, {
					opacity: 0,
					y: reduce ? 0 : 28,
					scale: reduce ? 1 : 0.94,
					filter: reduce ? "none" : "blur(8px)",
				})
				gsap.set(bits, { opacity: 0, y: reduce ? 0 : 14 })

				const tl = gsap.timeline({
					defaults: { ease: "expo.out" },
					onComplete: () => panel.focus(),
				})

				tl.to(backdrop, { opacity: 1, duration: reduce ? 0.01 : 0.35 }, 0).to(
					panel,
					{
						opacity: 1,
						y: 0,
						scale: 1,
						filter: "blur(0px)",
						duration: reduce ? 0.01 : 0.55,
					},
					0.05,
				)

				if (!reduce) {
					tl.to(
						bits,
						{ opacity: 1, y: 0, duration: 0.45, stagger: 0.06 },
						0.18,
					)
				} else {
					gsap.set(bits, { opacity: 1, y: 0 })
				}

				const stars = starsRef.current?.querySelectorAll("[data-star]")
				if (stars?.length && !reduce) {
					tl.fromTo(
						stars,
						{ scale: 0.6, opacity: 0 },
						{
							scale: 1,
							opacity: 1,
							duration: 0.35,
							stagger: 0.03,
							ease: "back.out(1.6)",
						},
						0.28,
					)
				}
			} else {
				const tl = gsap.timeline({
					defaults: { ease: "power2.in" },
					onComplete: () => setMounted(false),
				})

				tl.to(panel, {
					opacity: 0,
					y: reduce ? 0 : 16,
					scale: reduce ? 1 : 0.96,
					filter: reduce ? "none" : "blur(4px)",
					duration: reduce ? 0.01 : 0.28,
				}).to(
					backdrop,
					{ opacity: 0, duration: reduce ? 0.01 : 0.22 },
					0,
				)
			}
		},
		{ dependencies: [isOpen, mounted], scope: rootRef },
	)

	useGSAP(
		() => {
			if (!mounted || !scoreRef.current || prefersReducedMotion()) return
			gsap.fromTo(
				scoreRef.current,
				{ scale: 1.18, y: -4 },
				{ scale: 1, y: 0, duration: 0.4, ease: "back.out(1.8)" },
			)
		},
		{ dependencies: [rating, mounted], scope: rootRef },
	)

	useGSAP(
		() => {
			if (!mounted || !starsRef.current || prefersReducedMotion() || rating <= 0) return
			const filled = starsRef.current.querySelectorAll("[data-star][data-active='true']")
			if (!filled.length) return
			gsap.fromTo(
				filled,
				{ scale: 1.25 },
				{ scale: 1, duration: 0.28, stagger: 0.02, ease: "power2.out", overwrite: "auto" },
			)
		},
		{ dependencies: [rating, mounted], scope: rootRef },
	)

	const handleSubmit = async () => {
		if (rating === 0) return

		try {
			await rateMovie({
				movieId: movie.id,
				title: movie.title,
				poster: movie.poster_path || "",
				rating,
				review: review || undefined,
				quotedRatingId: quotedRatingId ?? undefined,
			})
			onClose()
			setRating(0)
			setReview("")
		} catch {
			// Error handled by hook toast
		}
	}

	const handleReset = async () => {
		try {
			await resetRating(movie.id)
			onClose()
			setRating(0)
			setReview("")
		} catch {
			// Error handled by hook toast
		}
	}

	if (!mounted) return null

	return (
		<div ref={rootRef} className="contents">
			<div
				ref={backdropRef}
				onClick={onClose}
				className="fixed inset-0 z-40 bg-[var(--color-ink)]/80 backdrop-blur-md"
				aria-hidden
			/>

			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="rating-modal-title"
				tabIndex={-1}
				className="fixed left-1/2 top-1/2 z-50 w-[min(100%-1.5rem,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-ink-elevated)] outline-none shadow-[0_24px_80px_rgba(0,0,0,0.55)] will-change-transform"
			>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(255,77,61,0.18),transparent_70%)]"
				/>

				<button
					type="button"
					onClick={onClose}
					aria-label="Close rating modal"
					className="absolute right-3 top-3 z-10 rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text)]"
				>
					<X className="h-4 w-4" />
				</button>

				<div className="relative space-y-6 p-6 md:p-7">
					<div data-rate-bit className="flex items-start gap-4 pr-8">
						{movie.poster_path ? (
							<div className="relative h-[5.5rem] w-[3.65rem] flex-none overflow-hidden rounded-lg border border-[var(--color-border)]">
								<Image
									src={tmdb.getImageUrl(movie.poster_path, "w200")}
									alt=""
									fill
									unoptimized
									sizes="60px"
									className="object-cover"
								/>
							</div>
						) : null}
						<div className="min-w-0 pt-0.5">
							<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-signal)]">
								Your score
							</p>
							<h3 className="mt-1 font-heading text-lg font-bold leading-snug tracking-tight text-[var(--color-text)] text-balance">
								{movie.title}
							</h3>
							{year ? (
								<p className="mt-1 font-mono text-xs text-[var(--color-text-secondary)]">
									{year}
								</p>
							) : null}
						</div>
					</div>

					<div data-rate-bit>
						<h2
							id="rating-modal-title"
							className="font-heading text-2xl font-bold tracking-tight text-[var(--color-text)]"
						>
							{existingRating ? "Update your rating" : "Rate this movie"}
						</h2>
						<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
							Tap left/right half of a star for half scores
						</p>
					</div>

					<div
						data-rate-bit
						className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink)]/50 px-4 py-5"
					>
						<div
							ref={starsRef}
							className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
							role="group"
							aria-label="Star rating from 0.5 to 10"
						>
							{Array.from({ length: 10 }).map((_, i) => {
								const starIndex = i + 1
								const isFilled = starIndex <= displayRating
								const isHalf = !isFilled && starIndex - 0.5 <= displayRating
								const active = isFilled || isHalf

								return (
									<button
										key={starIndex}
										type="button"
										data-star
										data-active={active ? "true" : "false"}
										onClick={(event) => setRating(getHalfStepValue(event, starIndex))}
										onMouseMove={(event) =>
											setHoverRating(getHalfStepValue(event, starIndex))
										}
										onMouseLeave={() => setHoverRating(0)}
										aria-label={`Rate ${starIndex} out of 10`}
										className="relative rounded-md p-0.5 will-change-transform"
									>
										{isFilled ? (
											<Star className="h-5 w-5 fill-[var(--color-signal)] text-[var(--color-signal)] sm:h-[1.35rem] sm:w-[1.35rem]" />
										) : isHalf ? (
											<span className="relative inline-flex">
												<Star className="h-5 w-5 text-white/15 sm:h-[1.35rem] sm:w-[1.35rem]" />
												<span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
													<Star className="h-5 w-5 fill-[var(--color-signal)] text-[var(--color-signal)] sm:h-[1.35rem] sm:w-[1.35rem]" />
												</span>
											</span>
										) : (
											<Star className="h-5 w-5 text-white/15 transition-colors hover:text-white/30 sm:h-[1.35rem] sm:w-[1.35rem]" />
										)}
									</button>
								)
							})}
						</div>

						<div className="mt-4 flex items-baseline justify-center gap-1">
							<span
								ref={scoreRef}
								className="inline-block origin-center font-heading text-4xl font-bold tracking-tight text-[var(--color-signal)] will-change-transform"
							>
								{rating.toFixed(1)}
							</span>
							<span className="font-mono text-sm text-[var(--color-text-secondary)]">/10</span>
						</div>
					</div>

					{quoteSource ? (
						<div
							data-rate-bit
							className="rounded-xl border border-[var(--color-signal-border)]/50 bg-[var(--color-signal-muted)]/40 px-4 py-3"
						>
							<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
								Quoting {quoteSource.authorName}
							</p>
							<p className="mt-1.5 line-clamp-3 text-sm italic text-[var(--color-text-secondary)]">
								“{quoteSource.review}”
							</p>
						</div>
					) : null}

					<div data-rate-bit>
						<label
							htmlFor="rating-review"
							className="mb-2 block text-sm font-medium text-[var(--color-text)]"
						>
							Write a review{" "}
							<span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
						</label>
						<textarea
							id="rating-review"
							value={review}
							onChange={(e) => setReview(e.target.value.slice(0, 500))}
							placeholder={
								quoteSource
									? "Add your take alongside the quote…"
									: "What stayed with you?"
							}
							rows={3}
							className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-ink)]/60 px-4 py-3 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-signal-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-signal)]/40"
						/>
						<p className="mt-2 font-mono text-[11px] text-[var(--color-text-muted)]">
							{review.length}/500
						</p>
					</div>

					<div data-rate-bit className="space-y-2.5">
						<button
							type="button"
							onClick={handleSubmit}
							disabled={rating === 0 || isRating || isResetting}
							aria-label="Save rating"
							className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-signal)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:cursor-not-allowed disabled:opacity-40"
						>
							{isRating ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Saving…
								</>
							) : existingRating ? (
								"Update rating"
							) : (
								"Save rating"
							)}
						</button>

						{existingRating ? (
							<button
								type="button"
								onClick={handleReset}
								disabled={isRating || isResetting}
								className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
							>
								{isResetting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Resetting…
									</>
								) : (
									"Reset rating"
								)}
							</button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	)
}
