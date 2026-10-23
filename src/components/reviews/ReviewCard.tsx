"use client"

import {
	MessageCircle,
	Quote,
	ThumbsDown,
	ThumbsUp,
	Heart,
	Trash2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { useToastContext } from "@/components/shared/ToastProvider"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc/client"

export type ReviewCardData = {
	id: number
	userId: string
	movieId: number
	movieTitle: string
	moviePoster?: string | null
	rating: number
	review: string
	author: {
		id: string
		name: string
		username?: string | null
		image?: string | null
	}
	agreeCount: number
	disagreeCount: number
	commentCount: number
	viewerReaction?: "agree" | "disagree" | null
	quotedReview?: {
		id: number
		review: string
		rating: number
		authorName: string
		authorUsername?: string | null
	} | null
	showMovieLink?: boolean
}

type ReviewCardProps = {
	review: ReviewCardData
	showMovieLink?: boolean
	compact?: boolean
}

export function ReviewCard({ review, showMovieLink, compact }: ReviewCardProps) {
	const router = useRouter()
	const { user, isAuthenticated } = useAuth()
	const { showToast } = useToastContext()
	const utils = trpc.useUtils()
	const [commentsOpen, setCommentsOpen] = useState(false)
	const [commentBody, setCommentBody] = useState("")
	const [card, setCard] = useState(review)

	useEffect(() => {
		const timer = setTimeout(() => {
			setCard(review)
		}, 0)
		return () => clearTimeout(timer)
	}, [review])

	const setReaction = trpc.reviews.setReaction.useMutation({
		onSuccess: async (updated) => {
			setCard((prev) => ({
				...prev,
				agreeCount: updated.agreeCount,
				disagreeCount: updated.disagreeCount,
				viewerReaction: updated.viewerReaction,
				commentCount: updated.commentCount,
			}))
			await Promise.all([
				utils.reviews.listForMovie.invalidate(),
				utils.reviews.listTasteMatched.invalidate(),
				utils.reviews.getPopularWeek.invalidate(),
				utils.reviews.listForAuthor.invalidate(),
				utils.reviews.getById.invalidate({ ratingId: review.id }),
			])
		},
		onError: (error) => showToast(error.message || "Could not update reaction", "error"),
	})

	const { data: comments = [], isLoading: commentsLoading } =
		trpc.reviews.listComments.useQuery(
			{ ratingId: card.id },
			{ enabled: commentsOpen && isAuthenticated },
		)

	const addComment = trpc.reviews.addComment.useMutation({
		onSuccess: async () => {
			setCommentBody("")
			setCard((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }))
			await utils.reviews.listComments.invalidate({ ratingId: review.id })
			await utils.reviews.listForMovie.invalidate()
			showToast("Comment posted", "success")
		},
		onError: (error) => showToast(error.message || "Could not comment", "error"),
	})

	const deleteComment = trpc.reviews.deleteComment.useMutation({
		onSuccess: async () => {
			setCard((prev) => ({
				...prev,
				commentCount: Math.max(0, prev.commentCount - 1),
			}))
			await utils.reviews.listComments.invalidate({ ratingId: review.id })
			await utils.reviews.listForMovie.invalidate()
		},
	})

	const likeComment = trpc.reviews.likeComment.useMutation({
		onSuccess: async () => {
			await utils.reviews.listComments.invalidate({ ratingId: review.id })
			await utils.reviews.getPopularWeek.invalidate()
		},
	})

	const unlikeComment = trpc.reviews.unlikeComment.useMutation({
		onSuccess: async () => {
			await utils.reviews.listComments.invalidate({ ratingId: review.id })
			await utils.reviews.getPopularWeek.invalidate()
		},
	})

	const ensureAuth = () => {
		if (isAuthenticated) return true
		showToast("Sign in to engage with reviews", "info")
		router.push("/login")
		return false
	}

	const handleReaction = (type: "agree" | "disagree") => {
		if (!ensureAuth()) return
		const next = card.viewerReaction === type ? ("clear" as const) : type
		setReaction.mutate({ ratingId: card.id, type: next })
	}

	const handleQuote = () => {
		if (!ensureAuth()) return
		router.push(`/movie/${card.movieId}?quoteRatingId=${card.id}&rate=1`)
	}

	return (
		<article
			id={`review-${card.id}`}
			className={cn(
				"scroll-mt-24 border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/40",
				compact ? "rounded-xl p-5" : "rounded-xl p-5 md:p-6",
			)}
		>
			<header className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					{card.author.image ? (
						<span className="relative h-10 w-10 flex-none overflow-hidden rounded-full bg-[var(--color-surface)]">
							<Image
								src={card.author.image}
								alt=""
								fill
								unoptimized
								sizes="40px"
								className="object-cover"
							/>
						</span>
					) : (
						<span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-signal-muted)] text-sm font-semibold text-[var(--color-signal)]">
							{card.author.name.slice(0, 1).toUpperCase()}
						</span>
					)}
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
							<Link
								href={`/profile/${card.author.id}`}
								className="truncate text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-signal)] md:text-base"
							>
								{card.author.name}
							</Link>
							{card.author.username ? (
								<span className="font-mono text-xs text-[var(--color-text-muted)]">
									@{card.author.username}
								</span>
							) : null}
						</div>
						{showMovieLink || card.showMovieLink ? (
							<Link
								href={`/movie/${card.movieId}`}
								className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-signal)]"
							>
								{card.movieTitle}
							</Link>
						) : null}
					</div>
				</div>
				<span className="shrink-0 font-mono text-base font-semibold text-[var(--color-signal)] md:text-lg">
					{card.rating}/10
				</span>
			</header>

			{card.quotedReview ? (
				<blockquote className="mt-3 border-l-2 border-[var(--color-signal)]/50 pl-3 text-sm text-[var(--color-text-secondary)]">
					<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
						Quoting {card.quotedReview.authorName}
					</p>
					<p className="mt-1 line-clamp-3 italic">“{card.quotedReview.review}”</p>
				</blockquote>
			) : null}

			<p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-text)] text-pretty md:text-base">
				{card.review}
			</p>

			<footer className="mt-4 flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => handleReaction("agree")}
					disabled={setReaction.isPending}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm",
						card.viewerReaction === "agree"
							? "border-[var(--color-signal-border)] bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
							: "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]",
					)}
				>
					<ThumbsUp className="h-3.5 w-3.5" />
					Agree {card.agreeCount > 0 ? card.agreeCount : ""}
				</button>
				<button
					type="button"
					onClick={() => handleReaction("disagree")}
					disabled={setReaction.isPending}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm",
						card.viewerReaction === "disagree"
							? "border-[var(--color-signal-border)] bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
							: "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]",
					)}
				>
					<ThumbsDown className="h-3.5 w-3.5" />
					Disagree {card.disagreeCount > 0 ? card.disagreeCount : ""}
				</button>
				<button
					type="button"
					onClick={() => setCommentsOpen((open) => !open)}
					className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)] sm:text-sm"
				>
					<MessageCircle className="h-3.5 w-3.5" />
					{card.commentCount} {card.commentCount === 1 ? "comment" : "comments"}
				</button>
				<button
					type="button"
					onClick={handleQuote}
					className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)] sm:text-sm"
				>
					<Quote className="h-3.5 w-3.5" />
					Quote
				</button>
			</footer>

			{commentsOpen ? (
				<div className="mt-5 space-y-4 border-t border-[var(--color-border)] pt-5">
					{commentsLoading ? (
						<p className="text-sm text-[var(--color-text-muted)]">Loading comments…</p>
					) : comments.length === 0 ? (
						<p className="text-sm text-[var(--color-text-muted)]">No comments yet</p>
					) : (
						<ul className="space-y-4">
							{comments.map((comment) => (
								<li key={comment.id} className="flex gap-3">
									{comment.author.image ? (
										<span className="relative mt-0.5 h-9 w-9 flex-none overflow-hidden rounded-full bg-[var(--color-surface)]">
											<Image
												src={comment.author.image}
												alt=""
												fill
												unoptimized
												sizes="36px"
												className="object-cover"
											/>
										</span>
									) : (
										<span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-signal-muted)] text-xs font-semibold text-[var(--color-signal)]">
											{comment.author.name.slice(0, 1).toUpperCase()}
										</span>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
											<span className="text-sm font-semibold text-[var(--color-text)]">
												{comment.author.name}
											</span>
											<button
												type="button"
												onClick={() => {
													if (!ensureAuth()) return
													if (comment.viewerHasLiked) {
														unlikeComment.mutate({ commentId: comment.id })
													} else {
														likeComment.mutate({ commentId: comment.id })
													}
												}}
												className={cn(
													"inline-flex items-center gap-1 text-xs",
													comment.viewerHasLiked
														? "text-[var(--color-signal)]"
														: "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
												)}
											>
												<Heart
													className={cn(
														"h-3.5 w-3.5",
														comment.viewerHasLiked && "fill-current",
													)}
												/>
												{comment.likeCount || ""}
											</button>
											{user?.id === comment.author.id ? (
												<button
													type="button"
													onClick={() =>
														deleteComment.mutate({ commentId: comment.id })
													}
													className="text-[var(--color-text-muted)] hover:text-[var(--color-signal)]"
													aria-label="Delete comment"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											) : null}
										</div>
										<p className="mt-1 text-[15px] leading-relaxed text-[var(--color-text-secondary)] md:text-base">
											{comment.body}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}

					<form
						onSubmit={(event) => {
							event.preventDefault()
							if (!ensureAuth() || !commentBody.trim()) return
							addComment.mutate({ ratingId: card.id, body: commentBody.trim() })
						}}
						className="flex gap-2.5"
					>
						<input
							value={commentBody}
							onChange={(event) => setCommentBody(event.target.value)}
							placeholder="Add a comment…"
							maxLength={500}
							className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-ink)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-signal-border)] focus:outline-none md:text-base"
						/>
						<button
							type="submit"
							disabled={addComment.isPending || !commentBody.trim()}
							className="rounded-xl bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-50"
						>
							Post
						</button>
					</form>
				</div>
			) : null}
		</article>
	)
}
