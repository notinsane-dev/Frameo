"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ThumbsUp } from "lucide-react"

import { ReviewCard } from "@/components/reviews/ReviewCard"
import { useAuth } from "@/hooks/useAuth"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"

export function PopularReviewsSection() {
	const { isAuthenticated } = useAuth()
	const { data, isLoading } = trpc.reviews.getPopularWeek.useQuery(
		{ limit: 6 },
		{ enabled: isAuthenticated },
	)

	if (!isAuthenticated) return null

	const reviews = data?.reviews ?? []
	const comments = data?.comments ?? []

	if (!isLoading && reviews.length === 0 && comments.length === 0) {
		return null
	}

	return (
		<section className="mx-auto w-full max-w-7xl space-y-10 px-6 py-14 md:px-12">
			<div>
				<p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
					This week
				</p>
				<h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
					Popular on Frameo
				</h2>
				<p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
					Reviews and comments catching fire among people you can see.
				</p>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="h-40 animate-pulse rounded-xl bg-[var(--color-surface)]"
						/>
					))}
				</div>
			) : (
				<div className="space-y-12">
					<div className="space-y-4">
						<h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
							<ThumbsUp className="h-4 w-4 text-[var(--color-signal)]" />
							Popular reviews
						</h3>
						{reviews.length === 0 ? (
							<p className="text-sm text-[var(--color-text-muted)]">
								No popular reviews yet this week.
							</p>
						) : (
							<div className="mx-auto w-full max-w-3xl space-y-4">
								{reviews.map((review) => (
									<ReviewCard
										key={review.id}
										review={{ ...review, showMovieLink: true }}
										showMovieLink
									/>
								))}
							</div>
						)}
					</div>

					<div className="space-y-4">
						<h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
							<Heart className="h-4 w-4 text-[var(--color-signal)]" />
							Popular comments
						</h3>
						{comments.length === 0 ? (
							<p className="text-sm text-[var(--color-text-muted)]">
								No popular comments yet this week.
							</p>
						) : (
							<ul className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-2">
								{comments.map((comment) => (
									<li
										key={comment.id}
										className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/40 p-4"
									>
										<div className="flex items-start gap-3">
											{comment.review.moviePoster ? (
												<Link
													href={`/movie/${comment.review.movieId}#review-${comment.review.id}`}
													className="relative h-14 w-9 flex-none overflow-hidden rounded bg-[var(--color-surface)]"
												>
													<Image
														src={tmdb.getImageUrl(comment.review.moviePoster, "w200")}
														alt=""
														fill
														unoptimized
														sizes="36px"
														className="object-cover"
													/>
												</Link>
											) : null}
											<div className="min-w-0 flex-1">
												<p className="text-xs text-[var(--color-text-muted)]">
													<span className="font-semibold text-[var(--color-text)]">
														{comment.author.name}
													</span>{" "}
													on{" "}
													<Link
														href={`/movie/${comment.review.movieId}#review-${comment.review.id}`}
														className="text-[var(--color-signal)] hover:underline"
													>
														{comment.review.movieTitle}
													</Link>
												</p>
												<p className="mt-1 text-sm text-[var(--color-text)]">
													{comment.body}
												</p>
												<p className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-[var(--color-text-muted)]">
													<Heart className="h-3 w-3 text-[var(--color-signal)]" />
													{comment.likeCount} likes this week
												</p>
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</section>
	)
}
